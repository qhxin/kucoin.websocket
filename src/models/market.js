import _ from 'lodash';
import delay from '../utils/delay';
import extend from 'dva-model-extend';
import base from './common/base';
import sort from './common/sort';
import filter from './common/filter';
import polling from './common/polling';
import wsMarketReducer from './ws/wsMarketReducer';
import { getCoins } from '../services/market';
import { getMarketAreas } from '../services/open';

export default extend(base, sort, filter, polling, wsMarketReducer, {
  namespace: 'market',
  state: {
    filters: {
      area: '',
    },
    areas: [],
    symbolsMap: {},
    coinPairMap: {},
  },
  reducers: {
    updateAreas(state, { payload }) {
      return {
        ...state,
        areas: payload,
      };
    },
    updateAreaSymbols(state, { payload: { area, records } }) {
      const temp = [..._.map(state.symbolsMap, r => r), records];
      // 简历  coin-pair map；
      const coinPairMap = temp.reduce((result, cur) => {
        return cur.reduce((rslt, ccur) => {
          return Object.assign({}, rslt, {
            [ccur.symbol]: { ...ccur },
          });
        }, {});
      }, {});
      return {
        ...state,
        symbolsMap: {
          ...state.symbolsMap,
          [area]: records,
        },
        coinPairMap: {
          ...state.coinPairMap,
          ...coinPairMap,
        },
      };
    },
  },
  effects: {
    *pullAreas({ payload = {} }, { call, put }) {
      try {
        const { data } = yield call(getMarketAreas);
        yield put({ type: 'updateAreas', payload: data });
      } catch (e) {
        yield call(delay, 3000);
        yield put({ type: 'pullAreas' });
      }
    },

    *pullAreaSymbols({ payload: { area } }, { call, put }) {
      const { data } = yield call(getCoins, area);
      const records = data.filter(item => item && item.trading);

      yield put({
        type: 'updateAreaSymbols',
        payload: { area, records },
      });
    },

    *query({ payload = {} }, { put, select }) {
      const { area } = yield select(state => state.market.filters);

      yield put({ type: 'pullAreaSymbols', payload: { area } });
    },

    *pullAllAreaSymbols({ payload = {} }, { put, select }) {
      const { areas } = yield select(state => state.market);

      for (let i = 0; i < areas.length; i += 1) {
        yield put({ type: 'pullAreaSymbols', payload: { area: areas[i] } });
      }
    },

    *wsMarketFinalReducer({ payload: { area, records } }, { put, select }) {
      const dataLength = records.length;
      const [symbolsMap] = yield select(state => [
        state.market.symbolsMap,
      ]);

      if (!dataLength) {
        return;
      }

      const markets = symbolsMap[area] || [];
      const marketsLength = markets.length;

      for (let i = 0; i < dataLength; i++) {
        const data = records[i];

        // 更新交易对数据
        for (let j = 0; j < marketsLength; j++) {
          const { symbol } = markets[j];
          if (symbol === data.symbol) {
            markets[j] = {
              ...markets[j],
              ...data,
            };
            break;
          }
        }
      }

      // 更新交易区数据
      yield put({
        type: 'updateAreaSymbols',
        payload: {
          area,
          records: [
            ...markets,
          ],
        },
      });
    },
  },
  subscriptions: {
    setUp({ dispatch }) {
      dispatch({
        type: 'watchPolling',
        payload: { effect: 'pullAllAreaSymbols', interval: 40 * 1000 },
      });
      dispatch({
        type: 'watchPolling',
        payload: { effect: 'pullAreas', interval: 10 * 60 * 1000 },
      });
      dispatch({ type: 'watchPolling', payload: { effect: 'filter' } });

      dispatch({ type: 'pullAreas' });
    },
  },
});
