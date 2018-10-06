import extend from 'dva-model-extend';
import ws from '../common/ws';
import {
  finalReducerName,
} from '../../utils/ws';

const reducerName = 'wsMarketReducer';

// final handler
const reducerFinalName = finalReducerName(reducerName);

export default extend(ws, {
  effects: {
    *[reducerName]({ type, payload, params }, { put }) {
      const messages = payload; // wsListener缓存多次message的消息后分发，因此这里需要处理消息数组

      // messages中先到的消息在前
      const messageLength = messages.length;
      if (!messageLength) {
        return;
      }

      const { area } = params;
      const records = messages
        .filter(({ data }) => {
          if (!data || !data.symbol) {
            console.log(`[${reducerName}] Invalid data`);
            return false;
          }
          return true;
        })
        .map(({ data }) => data);

      // 交给market
      // const finalReducerType = type.replace(reducerName, reducerFinalName);
      yield put({
        params,
        type: reducerFinalName,
        payload: { area, records },
      });
    },
  },
  subscriptions: {
    [reducerName]({ dispatch }) { // 模型注册，勿动
      dispatch({ type: 'wsRegister', payload: reducerName });
    },
  },
});
