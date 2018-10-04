import _ from 'lodash';
import extend from 'dva-model-extend';
import base from './common/base';
import polling from './common/polling';
import wsTradeHistoryReducer from './ws/wsTradeHistoryReducer';
import { adjustmentManager } from './ws/handler';
import { getDealOrders } from '../services/market';

// current limit
let _limit = 50;

export default extend(base, polling, wsTradeHistoryReducer, {
  namespace: 'dealOrders',
  state: {},
  reducers: {},
  effects: {
    // pull dealOrders by http limit
    *pull({ type, payload: { coinPair, limit, since } }, { call, put }) {
      const _namespace = type.split('/')[0];
      const { data } = yield call(getDealOrders, coinPair, limit, since);
      _limit = limit;

      adjustmentManager.passPull(_namespace);

      yield put({
        type: 'update',
        payload: {
          [coinPair]: (data || []).reverse().map((item) => {
            return {
              key: item[5],
              datetime: item[0],
              type: item[1],
              price: item[2],
              amount: item[3],
              volValue: item[4],
            };
          }),
        },
      });
    },
    *wsTradeHistoryFinalReducer({ type, params, payload }, { put, select }) {
      const _namespace = type.split('/')[0];
      const limitSeq = adjustmentManager.passWs(_namespace);

      const { symbol } = params;
      const [oldList] = yield select((state) => {
        return [
          state.dealOrders[symbol],
        ];
      });

      const limit = _limit;

      const list = payload
        .filter(({ seq }) => {
          return seq > limitSeq;
        })
        .map(({ data }) => data)
        .sort((a, b) => b.datetime - a.datetime)
        .concat(oldList || [])
        .slice(0, 2 * limit);

        // key 去重
      const keyExists = {};
      const finalList = [];
      _.each(list, (item) => {
        if (!keyExists[item.key]) {
          keyExists[item.key] = true;
          finalList.push(item);
        }
      });

      yield put({
        type: 'update',
        payload: {
          [symbol]: finalList.slice(0, limit),
        },
      });
    },
  },
  subscriptions: {
    setUp({ dispatch }) {
      dispatch({
        type: 'watchPolling',
        payload: { effect: 'pull' },
      });
    },
  },
});
