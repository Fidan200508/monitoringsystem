"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isPlainObject = isPlainObject;
exports.findIndex = exports.noop = exports.returnSelf = exports.isFunction = exports.isArray = void 0;

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var isArray = Array.isArray.bind(Array);
exports.isArray = isArray;

var isFunction = function isFunction(o) {
  return typeof o === 'function';
};

exports.isFunction = isFunction;

var returnSelf = function returnSelf(m) {
  return m;
};

exports.returnSelf = returnSelf;

var noop = function noop() {};

exports.noop = noop;

var findIndex = function findIndex(array, predicate) {
  for (var i = 0, length = array.length; i < length; i += 1) {
    if (predicate(array[i], i)) return i;
  }

  return -1;
};

exports.findIndex = findIndex;

function isPlainObject(obj) {
  if (_typeof(obj) !== 'object' || obj === null) return false;
  var proto = obj;

  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }

  return Object.getPrototypeOf(obj) === proto;
}