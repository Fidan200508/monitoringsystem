import log from 'log-tips'
import { isArray } from './utils'
import { NAMESPACE_SEP } from './constants'

const updateState = (state, { payload }) => {
  return { ...state, ...payload }
}

const addDefaultReducer = reducers =>
  Object.assign({}, { updateState }, reducers)

function prefix(obj, namespace, type) {
  if (type === 'reducer') {
    obj = addDefaultReducer(obj)
  }
  return Object.keys(obj).reduce((memo, key) => {
    log(
      key.indexOf(`${namespace}${NAMESPACE_SEP}`) !== 0,
      `[prefixNamespace]: ${type} ${key} should not be prefixed with namespace ${namespace}`,
      'warn'
    )
    const newKey = `${namespace}${NAMESPACE_SEP}${key}`
    memo[newKey] = obj[key]
    return memo
  }, {})
}

export default function prefixNamespace(model) {
  const { namespace, reducers, effects } = model
  if (isArray(reducers)) {
    model.reducers[0] = prefix(reducers[0], namespace, 'reducer')
  } else {
    model.reducers = prefix(reducers, namespace, 'reducer')
  }
  if (effects) {
    model.effects = prefix(effects, namespace, 'effect')
  }
  return model
}
