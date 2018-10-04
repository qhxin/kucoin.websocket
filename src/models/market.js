import _ from 'lodash';
import delay from '../utils/delay';
import extend from 'dva-model-extend';
import base from './common/base';
import sort from './common/sort';
import filter from './common/filter';
import polling from './common/polling';
import wsMarketReducer from './ws/wsMarketReducer';
import {
  getCoins,
  getUserStickSymbols,
  getUserFavSymbols,
  userFavSymbols,
  userStickSymbols,
} from '../services/market';
import { getMarketAreas } from '../services/open';

export default extend(base, sort, filter, polling, wsMarketReducer, {
  namespace: 'market',
  state: {
    filters: {
      area: '',
    },
    areas: [],
    records: [],
    homeRecords: [], // deprecated
    symbolsMap: {},
    stickSymbols: [],
    favSymbols: [],
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

    // 此方法只取全部交易对，records 只装全部交易对
    *pull({ payload = {} }, { call, put }) {
      const { data } = yield call(getCoins, '');
      const records = data.filter(item => !!item);

      yield put({ type: 'update', payload: { records } });
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

    *pullHome({ payload = {} }, { call, put }) {
      const { data } = yield call(getCoins, 'BTC');

      const enabledRecords = data.filter(item => item && item.trading);
      const homeRecords = enabledRecords.filter((item, index) => index < 12);

      yield put({
        type: 'update',
        payload: { homeRecords },
      });
    },

    *wsMarketFinalReducer({ payload: { area, records } }, { put, select }) {
      const dataLength = records.length;
      const [symbolsMap, fullRecords] = yield select(state => [
        state.market.symbolsMap,
        state.market.records,
      ]);

      if (!dataLength) {
        return;
      }

      const markets = symbolsMap[area] || [];
      const marketsLength = markets.length;
      const fullRecordsLen = fullRecords.length;

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

        for (let j = 0; j < fullRecordsLen; j++) {
          const { symbol } = fullRecords[j];
          if (symbol === data.symbol) {
            fullRecords[j] = {
              ...fullRecords[j],
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

      // 更新所有的列表
      yield put({ type: 'update', payload: { records: fullRecords } });
    },

    *pullUserStickSymbols({ payload = {} }, { call, put }) {
      const { data } = yield call(getUserStickSymbols);
      if (data) {
        yield put({
          type: 'update',
          payload: { stickSymbols: data },
        });
      }
    },

    *pullUserFavSymbols({ payload = {} }, { call, put }) {
      const { data } = yield call(getUserFavSymbols);
      if (data) {
        yield put({
          type: 'update',
          payload: { favSymbols: data },
        });
      }
    },

    *userFavSymbols({ payload: { symbol, fav } }, { call, put }) {
      yield call(userFavSymbols, { symbol, fav });
      yield put({
        type: 'pullUserFavSymbols',
      });
    },

    *userStickSymbols({ payload: { symbol, stick } }, { call, put }) {
      yield call(userStickSymbols, { symbol, stick });
      yield put({
        type: 'pullUserStickSymbols',
      });
    },

    *clearSelfSymbols({ payload }, { put }) {
      yield put({
        type: 'update',
        payload: {
          favSymbols: [],
          stickSymbols: [],
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
      dispatch({ type: 'watchPolling', payload: { effect: 'pull', interval: 40 * 1000 } });
      dispatch({ type: 'watchPolling', payload: { effect: 'filter' } });
      dispatch({ type: 'watchPolling', payload: { effect: 'pullHome' } });

      dispatch({ type: 'pullAreas' });
    },
  },
});
