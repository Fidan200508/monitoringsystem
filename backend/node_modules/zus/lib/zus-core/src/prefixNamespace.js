"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = prefixNamespace;

var _logTips = _interopRequireDefault(require("log-tips"));

var _utils = require("./utils");

var _constants = require("./constants");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var updateState = function updateState(state, _ref) {
  var payload = _ref.payload;
  return _objectSpread({}, state, payload);
};

var addDefaultReducer = function addDefaultReducer(reducers) {
  return Object.assign({}, {
    updateState: updateState
  }, reducers);
};

function prefix(obj, namespace, type) {
  if (type === 'reducer') {
    obj = addDefaultReducer(obj);
  }

  return Object.keys(obj).reduce(function (memo, key) {
    (0, _logTips["default"])(key.indexOf("".concat(namespace).concat(_constants.NAMESPACE_SEP)) !== 0, "[prefixNamespace]: ".concat(type, " ").concat(key, " should not be prefixed with namespace ").concat(namespace), 'warn');
    var newKey = "".concat(namespace).concat(_constants.NAMESPACE_SEP).concat(key);
    memo[newKey] = obj[key];
    return memo;
  }, {});
}

function prefixNamespace(model) {
  var namespace = model.namespace,
      reducers = model.reducers,
      effects = model.effects;

  if ((0, _utils.isArray)(reducers)) {
    model.reducers[0] = prefix(reducers[0], namespace, 'reducer');
  } else {
    model.reducers = prefix(reducers, namespace, 'reducer');
  }

  if (effects) {
    model.effects = prefix(effects, namespace, 'effect');
  }

  return model;
}