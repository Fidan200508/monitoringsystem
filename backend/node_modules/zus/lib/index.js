"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = zus;
Object.defineProperty(exports, "connect", {
  enumerable: true,
  get: function get() {
    return _reactRedux.connect;
  }
});
Object.defineProperty(exports, "dynamic", {
  enumerable: true,
  get: function get() {
    return _dynamic["default"];
  }
});

var _react = _interopRequireDefault(require("react"));

var _logTips = _interopRequireWildcard(require("log-tips"));

var _history = require("history");

var _reactRedux = require("react-redux");

var _reactDom = _interopRequireDefault(require("react-dom"));

var _dynamic = _interopRequireDefault(require("./dynamic"));

var _src = _interopRequireDefault(require("./zus-core/src"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj["default"] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function zus() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var history = opts.history || (0, _history.createHashHistory)();
  var createOpts = {
    setupApp: function setupApp(app) {
      app._history = patchHistory(history);
    }
  };
  var app = (0, _src["default"])(opts, createOpts);
  var oldAppStart = app.start;
  app.router = router;
  app.start = start;
  return app;

  function router(_router) {
    (0, _logTips["default"])((0, _logTips.isFn)(_router), "[app.router] router should be function, but got ".concat(_typeof(_router)));
    app._router = _router;
  }

  function start(container) {
    // 允许 container 是字符串，然后用 querySelector 找元素
    if ((0, _logTips.isString)(container)) {
      container = document.querySelector(container);
      (0, _logTips["default"])(container, "[app.start] container ".concat(container, " not found"));
    } // 并且是 HTMLElement


    (0, _logTips["default"])(!container || (0, _logTips.isNode)(container), '[app.start] container should be HTMLElement'); // 路由必须提前注册

    (0, _logTips["default"])(app._router, '[app.start] router must be registered before app.start()');

    if (!app._store) {
      oldAppStart.call(app);
    }

    var store = app._store;
    app._getProvider = getProvider.bind(null, store, app); // If has container, render; else, return react component

    if (container) {
      render(container, store, app, app._router);

      app._plugin.apply('onHmr')(render.bind(null, container, store, app));

      return false;
    }

    return getProvider(store, this, this._router);
  }
}

function getProvider(store, app, router) {
  var Root = function Root(extraProps) {
    return _react["default"].createElement(_reactRedux.Provider, {
      store: store
    }, router(_objectSpread({
      app: app
    }, extraProps)));
  };

  return Root;
}

function render(container, store, app, router) {
  _reactDom["default"].render(_react["default"].createElement(getProvider(store, app, router)), container);
}

function patchHistory(history) {
  var oldListen = history.listen;

  history.listen = function (callback) {
    callback(history.location);
    return oldListen.call(history, callback);
  };

  return history;
}