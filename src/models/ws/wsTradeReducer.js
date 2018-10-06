import extend from 'dva-model-extend';
import ws from '../common/ws';
import {
  finalReducerName,
  subscribedReducerName,
  unsubscribedReducerName,
} from '../../utils/ws';
import { adjustmentManager } from './handler';

const reducerName = 'wsTradeReducer';

// final handler
const reducerFinalName = finalReducerName(reducerName);
const _subscribedReducerName = subscribedReducerName(reducerName);
const _unsubscribedReducerName = unsubscribedReducerName(reducerName);

export default extend(ws, {
  effects: {
    *[reducerName]({ type, payload, params }, { put }) {
      const messages = payload; // wsListener缓存多次message的消息后分发，因此这里需要处理消息数组

      // messages中先到的消息在前
      const messageLength = messages.length;
      if (!messageLength) {
        return;
      }

      const records = messages
        .filter(({ data }) => {
          if (!data || !data.type) {
            console.log(`[${reducerName}] Invalid data`);
            return false;
          }
          return true;
        });

      // const finalReducerType = type.replace(reducerName, reducerFinalName);
      yield put({
        params,
        type: reducerFinalName,
        payload: records,
      });
    },
    *[_subscribedReducerName]({ type }) {
      const _namespace = type.split('/')[0];
      adjustmentManager.register(_namespace);
    },
    *[_unsubscribedReducerName]({ type }) {
      const _namespace = type.split('/')[0];
      adjustmentManager.clear(_namespace);
    },
  },
  subscriptions: {
    [reducerName]({ dispatch }) { // 模型注册，勿动
      dispatch({ type: 'wsRegister', payload: reducerName });
    },
  },
});
