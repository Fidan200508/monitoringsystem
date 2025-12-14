import log from 'log-tips'
import { NAMESPACE_SEP } from './constants'
import prefixType from './prefixType'

export default function prefixedDispatch(dispatch, model) {
  return action => {
    const { type } = action
    log(type, 'dispatch: action should be a plain Object with type')
    log(
      type.indexOf(`${model.namespace}${NAMESPACE_SEP}`) !== 0,
      `dispatch: ${type} should not be prefixed with namespace ${
        model.namespace
      }`,
      'warn'
    )
    return dispatch({ ...action, type: prefixType(type, model) })
  }
}
