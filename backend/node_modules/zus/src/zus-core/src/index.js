/* eslint-disable */
import { combineReducers } from 'redux'
import createSagaMiddleware from 'redux-saga'
import log, { isString, isNode, isFn } from 'log-tips'
import checkModel from './checkModel'
import prefixNamespace from './prefixNamespace'
import Plugin, { filterHooks } from './Plugin'
import createStore from './createStore'
import getSaga from './getSaga'
import getReducer from './getReducer'
import createPromiseMiddleware from './createPromiseMiddleware'
import {
  run as runSubscription,
  unlisten as unlistenSubscription
} from './subscription'
import { noop, findIndex } from './utils'

// Internal model to update global state when do unmodel
const zusModel = {
  namespace: '@zus',
  state: 0,
  reducers: {
    UPDATE(state) {
      return state + 1
    }
  }
}

/**
 * Create zus-core instance.
 *
 * @param hooksAndOpts
 * @param createOpts
 */
export default function create(hooksAndOpts = {}, createOpts = {}) {
  // 解析了createOpts => set upApp
  const { setupApp = noop } = createOpts

  const plugin = new Plugin()
  plugin.use(filterHooks(hooksAndOpts)) // 在定义的hooks中加入全局的配置
  const app = {
    _models: [prefixNamespace({ ...zusModel })],
    _store: null,
    _plugin: plugin,
    use: plugin.use.bind(plugin),
    model,
    start
  }
  return app

  /**
   * Register model before app is started.
   *
   * @param m {Object} model to register
   */
  function model(m) {
    if (process.env.NODE_ENV !== 'production') {
      checkModel(m, app._models)
    }
    const prefixedModel = prefixNamespace({ ...m })
    app._models.push(prefixedModel)
    return prefixedModel
  }

  /**
   * Inject model after app is started.
   *
   * @param createReducer
   * @param onError
   * @param unlisteners
   * @param m
   */
  function injectModel(createReducer, onError, unlisteners, m) {
    m = model(m)

    const store = app._store
    store.asyncReducers[m.namespace] = getReducer(
      m.reducers,
      m.state,
      plugin._handleActions
    )
    store.replaceReducer(createReducer())
    if (m.effects) {
      store.runSaga(app._getSaga(m.effects, m, onError, plugin.get('onEffect')))
    }
    if (m.subscriptions) {
      unlisteners[m.namespace] = runSubscription(
        m.subscriptions,
        m,
        app,
        onError
      )
    }
  }

  /**
   * Unregister model.
   *
   * @param createReducer
   * @param reducers
   * @param unlisteners
   * @param namespace
   *
   * Unexpected key warn problem:
   * https://github.com/reactjs/redux/issues/1636
   */
  function unmodel(createReducer, reducers, unlisteners, namespace) {
    const store = app._store

    // Delete reducers
    delete store.asyncReducers[namespace]
    delete reducers[namespace]
    store.replaceReducer(createReducer())
    store.dispatch({ type: '@@zus/UPDATE' })

    // Cancel effects
    store.dispatch({ type: `${namespace}/@@CANCEL_EFFECTS` })

    // Unlisten subscrioptions
    unlistenSubscription(unlisteners, namespace)

    // Delete model from app._models
    app._models = app._models.filter(_model => _model.namespace !== namespace)
  }

  /**
   * Replace a model if it exsits, if not, add it to app
   * Attention:
   * - Only available after zus.start gets called
   * - Will not check origin m is strict equal to the new one
   * Useful for HMR
   * @param createReducer
   * @param reducers
   * @param unlisteners
   * @param onError
   * @param m
   */
  function replaceModel(createReducer, reducers, unlisteners, onError, m) {
    const store = app._store
    const { namespace } = m
    const oldModelIdx = findIndex(
      app._models,
      model => model.namespace === namespace
    )

    if (oldModelIdx !== -1) {
      // Cancel effects
      store.dispatch({ type: `${namespace}/@@CANCEL_EFFECTS` })

      // Delete reducers
      delete store.asyncReducers[namespace]
      delete reducers[namespace]

      // Unlisten subscrioptions
      unlistenSubscription(unlisteners, namespace)

      // Delete model from app._models
      app._models.splice(oldModelIdx, 1)
    }

    // add new version model to store
    app.model(m)

    store.dispatch({ type: '@@zus/UPDATE' })
  }

  /**
   * Start the app.
   *
   * @returns void
   */
  function start() {
    const onError = (err, extension) => {
      if (err) {
        if (typeof err === 'string') err = new Error(err)
        err.preventDefault = () => {
          err._dontReject = true
        }
        plugin.apply('onError', _err => {
          throw new Error(_err.stack || _err)
        })(err, app._store.dispatch, extension)
      }
    }

    const sagaMiddleware = createSagaMiddleware() // saga 中间件
    const promiseMiddleware = createPromiseMiddleware(app) //
    app._getSaga = getSaga.bind(null)

    const sagas = []
    const reducers = {}
    for (const m of app._models) {
      reducers[m.namespace] = getReducer(
        m.reducers,
        m.state,
        plugin._handleActions
      )
      if (m.effects)
        sagas.push(app._getSaga(m.effects, m, onError, plugin.get('onEffect')))
    }
    const reducerEnhancer = plugin.get('onReducer')
    const extraReducers = plugin.get('extraReducers')
    log(
      Object.keys(extraReducers).every(key => !(key in reducers)),
      `[app.start] extraReducers is conflict with other reducers, reducers list: ${Object.keys(
        reducers
      ).join(', ')}`
    )

    // Create store
    const store = createStore({
      reducers: createReducer(),
      initialState: hooksAndOpts.initialState || {},
      plugin,
      createOpts,
      sagaMiddleware,
      promiseMiddleware
    })
    app._store = store
    // Extend store
    store.runSaga = sagaMiddleware.run
    store.asyncReducers = {}

    // Execute listeners when state is changed
    const listeners = plugin.get('onStateChange')
    for (const listener of listeners) {
      store.subscribe(() => {
        listener(store.getState())
      })
    }

    // Run sagas
    sagas.forEach(sagaMiddleware.run)

    // Setup app => 加入路由改变监听
    setupApp(app)

    // Run subscriptions
    const unlisteners = {}
    for (const model of this._models) {
      if (model.subscriptions) {
        unlisteners[model.namespace] = runSubscription(
          model.subscriptions,
          model,
          app,
          onError
        )
      }
    }

    // Setup app.model and app.unmodel
    app.model = injectModel.bind(app, createReducer, onError, unlisteners)
    app.unmodel = unmodel.bind(app, createReducer, reducers, unlisteners)
    app.replaceModel = replaceModel.bind(
      app,
      createReducer,
      reducers,
      unlisteners,
      onError
    )

    /**
     * Create global reducer for redux.
     *
     * @returns {Object}
     */
    function createReducer() {
      return reducerEnhancer(
        combineReducers({
          ...reducers,
          ...extraReducers,
          ...(app._store ? app._store.asyncReducers : {})
        })
      )
    }
  }
}
