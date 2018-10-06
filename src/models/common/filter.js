/**
 * 筛选器模型
 */
export default {
  state: {
    filters: null,
  },
  reducers: {
    updateFilters(state, { payload = null, override = false } = {}) {
      return {
        ...state,
        filters: {
          ...(override ? null : state.filters),
          page: 1,
          ...payload,
        },
      };
    },
  },
  effects: {
    *filter({ type, payload, override, effect = 'query' }, { put }) {
      yield put({ type: 'updateFilters', payload, override });

      if (effect) {
        yield put({ type: effect });
      }
    },
  },
};
