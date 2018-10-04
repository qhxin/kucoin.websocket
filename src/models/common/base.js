import _ from 'lodash';

/**
 * 基类模型
 */
export default {
  reducers: {
    // 更新 state
    update(state, { payload }) {
      return {
        ...state,
        ...payload,
      };
    },
    // 重置 state
    _reset(state, { payload }) {
      return payload;
    },
  },
  effects: {
    // 重置模型数据，如果没有 payload，重置为初始值
    *reset({ type, payload }, { select, put }) {
      const namespace = type.split('/')[0];
      const initValue = yield select(state => state.initValues[namespace]);

      if (typeof payload === 'undefined') {
        yield put({ type: '_reset', payload: initValue });
        return;
      }

      if (_.isPlainObject(payload) && _.isPlainObject(initValue)) {
        yield put({ type: '_reset', payload: { ...initValue, ...payload } });
        return;
      }

      yield put({ type: '_reset', payload });
    },
  },
};
