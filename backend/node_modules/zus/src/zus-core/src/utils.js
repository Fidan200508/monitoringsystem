export const isArray = Array.isArray.bind(Array)
export const isFunction = o => typeof o === 'function'
export const returnSelf = m => m
export const noop = () => {}
export const findIndex = (array, predicate) => {
  for (let i = 0, length = array.length; i < length; i += 1) {
    if (predicate(array[i], i)) return i
  }

  return -1
}

export function isPlainObject(obj) {
  if (typeof obj !== 'object' || obj === null) return false

  let proto = obj
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto)
  }

  return Object.getPrototypeOf(obj) === proto
}
