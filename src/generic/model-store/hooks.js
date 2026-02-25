import { useSelector, shallowEqual } from 'react-redux';

/*
  Return the selected model with the given id, or an empty object if the model does not exist "{}".
 */
export function useModel(type, id) {
  return useSelector(
    state => {
      // Defensive check: if id is undefined/null, return empty object
      if (id === undefined || id === null) {
        return {};
      }
      return ((state.models[type] !== undefined && state.models[type][id] !== undefined) ? state.models[type][id] : {});
    },
    shallowEqual,
  );
}

export function useModels(type, ids) {
  // Defensive check: if ids is undefined/null/empty, return empty array
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return [];
  }

  return useSelector(
    state => ids.map(
      id => ((state.models[type] !== undefined && state.models[type][id] !== undefined) ? state.models[type][id] : {}),
    ),
    shallowEqual,
  );
}
