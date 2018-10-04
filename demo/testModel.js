import extend from 'dva-model-extend';
import base from '../lib/models/common/base';

export default extend(base, {
  namespace: 'testModel',
  state: {
    count: 0,
  },
  reducers: {
    updateCount(state) {
      return {
        ...state,
        count: state.count + 1,
      };
    },
  },
});
