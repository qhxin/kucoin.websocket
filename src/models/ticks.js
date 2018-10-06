import extend from 'dva-model-extend';
import base from './common/base';
import polling from './common/polling';
import wsMarketTickReducer from './ws/wsMarketTickReducer';
import * as marketService from '../services/market';

// 货币对的当前交易快照
export default extend(base, polling, wsMarketTickReducer, {
  namespace: 'ticks',
  state: {},
  reducers: {},
  effects: {
    *pull({ payload: { coinPair } }, { call, put }) {
      const { data } = yield call(marketService.getCoinPairTick, coinPair);
      yield put({
        type: 'update',
        payload: { [coinPair]: data },
      });
    },
    *pullAll({ payload: { coinPairs } }, { call, put }) {
      for (let i = 0; i < coinPairs.length; i += 1) {
        const { data } = yield call(marketService.getCoinPairTick, coinPairs[i]);
        yield put({
          type: 'update',
          payload: { [coinPairs[i]]: data },
        });
      }
    },
    *wsMarketTickFinalReducer({ payload, params }, { put }) {
      const { symbol } = params;
      yield put({
        type: 'update',
        payload: { [symbol]: payload },
      });
    },
  },
  subscriptions: {
    setUp({ dispatch }) {
      dispatch({ type: 'watchPolling', payload: { effect: 'pull' } });
      dispatch({ type: 'watchPolling', payload: { effect: 'pullAll', interval: 20 * 1000 } });
    },
  },
});
