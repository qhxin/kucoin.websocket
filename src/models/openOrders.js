import _ from 'lodash';
import extend from 'dva-model-extend';
import base from './common/base';
import polling from './common/polling';
import wsTradeReducer from './ws/wsTradeReducer';
import { adjustmentManager } from './ws/handler';
import { getSellOrders, getBuyOrders } from '../services/market';
import { numberFixed, Decimal } from '../helper';

// limit
let _limit = 0;

export default extend(base, polling, wsTradeReducer, {
  namespace: 'openOrders',
  state: {
    groupMap: {},
    fullData: {},
  },
  reducers: {
    updateOrders(state, { payload: { coinPair, type, orders } }) {
      const data = type === 'sell' ? orders.reverse() : orders;
      let bigger = null;

      return {
        ...state,
        [coinPair]: {
          ...state[coinPair],
          [type]: data.map((item) => {
            bigger = {
              type,
              bigger,
              key: `${type}_${item[0]}`,
              price: item[0],
              amount: item[1],
              volValue: item[2],
            };
            return bigger;
          }),
        },
      };
    },
    updateFullData(state, { payload: { coinPair, type, orders } }) {
      return {
        ...state,
        fullData: {
          ...state.fullData,
          [coinPair]: {
            ...state.fullData[coinPair],
            [type]: orders,
          },
        },
      };
    },
  },
  effects: {
    *pull({ type, payload }, { put, call }) {
      const _namespace = type.split('/')[0];

      const { coinPair, limit, group } = payload;
      _limit = limit;

      const [sellDatas, buyDatas] = yield [
        call(getSellOrders, coinPair, limit, group),
        call(getBuyOrders, coinPair, limit, group),
      ];

      adjustmentManager.passPull(_namespace);

      yield put({
        type: 'updateFullData',
        payload: { coinPair, type: 'sell', orders: sellDatas.data },
      });
      yield put({
        type: 'updateFullData',
        payload: { coinPair, type: 'buy', orders: buyDatas.data },
      });
      yield put({
        type: 'updateOrders',
        payload: { coinPair, type: 'sell', orders: sellDatas.data },
      });
      yield put({
        type: 'updateOrders',
        payload: { coinPair, type: 'buy', orders: buyDatas.data },
      });
    },
    *setGroup({ type, payload: { coinPair, group } }, { select, put }) {
      const _namespace = type.split('/')[0];

      let { groupMap } = yield select(state => state.openOrders);
      groupMap = { ...groupMap, [coinPair]: group };

      yield put({ type: 'update', payload: { groupMap } });

      adjustmentManager.clear(_namespace);
    },
    *wsTradeFinalReducer(dispatchAction, { put, select }) {
      const { payload, params } = dispatchAction;
      const _namespace = dispatchAction.type.split('/')[0];
      const limitSeq = adjustmentManager.passWs(_namespace);

      const records = payload
        .filter(({ seq }) => {
          return seq > limitSeq;
        })
        .map(({ data }) => data);
      const { symbol } = params;

      const [coinType, coinTypePair] = symbol.split('-'); // eslint-disable-line no-unused-vars
      // const coin = yield select(state => state.categories[coinType]);
      const pair = yield select(state => state.categories[coinTypePair]);
      const { decimals } = pair;

      let group = yield select(state => state.openOrders.groupMap[symbol]);
      if (!group) {
        group = _.first(decimals).group;
      }

      let priceDecimal;
      if (group >= 100000000) {
        priceDecimal = 0;
      } else {
        const decimal = _.find(decimals, item => item.group === group);
        priceDecimal = decimal ? decimal.length : pair.tradePrecision;
      }

      // deepMaps 和 openOrders 各自取全量
      const fullData = yield select(state => state[_namespace].fullData[symbol]);
      const { buy = [], sell = [] } = fullData || {};
      const fullBuy = [...buy];
      const fullSell = [...sell];

      // key: `${type}_${item[0]}`,
      // price: item[0],
      // amount: item[1],
      // volValue: item[2],
      const buyMap = _.reduce(
        fullBuy,
        (acc, [price, amount, volValue]) => {
          const fixedPrice = numberFixed(price, priceDecimal);
          return {
            ...acc,
            [`buy_${fixedPrice}`]: { price, amount, volValue },
          };
        },
        Object.create(null),
      );
      const sellMap = _.reduce(
        fullSell,
        (acc, [price, amount, volValue]) => {
          const fixedPrice = numberFixed(price, priceDecimal);
          return {
            ...acc,
            [`sell_${fixedPrice}`]: { price, amount, volValue },
          };
        },
        Object.create(null),
      );

      for (let i = 0; i < records.length; i++) {
        // "type":"BUY or SELL",
        // "action":"ADD or CANCEL",
        // "time":"时间戳，用于去重业务",
        // "price":"价格",
        // "count":"数量",
        // "volume":"总价" // 后端给的数据不对，这个字段不使用，用price*count为增量
        const { type, action, price, count } = records[i];
        const volume = Decimal.mul(price, count).toNumber();
        const priceFixed = numberFixed(price, priceDecimal);

        const key = `${type.toLowerCase()}_${priceFixed}`;
        const priceMap = type === 'BUY' ? buyMap : (type === 'SELL' ? sellMap : {});
        if (key in priceMap) {
          let { amount, volValue } = priceMap[key];
          if (action === 'ADD') {
            amount = Decimal.add(amount, count).toNumber();
            volValue = Decimal.add(volValue, volume).toNumber();
          } else
          if (action === 'CANCEL') {
            amount = Decimal.sub(amount, count).toNumber();
            volValue = Decimal.sub(volValue, volume).toNumber();
          }
          priceMap[key] = { price, amount, volValue };
        } else
        if (action === 'ADD') {
          priceMap[key] = { price, amount: count, volValue: volume };
        } else
        if (action === 'CANCEL') {
          priceMap[key] = { price, amount: -count, volValue: -volume };
        }
      }

      // 大的在前
      const buyArrFull = _.map(buyMap, ({ price, amount, volValue }) => {
        return [price, amount, volValue];
      });
      const buyArr = _.map(buyArrFull, item => [...item])
        .filter(item => (
          item[1] > 0 &&
          item[2] > 0
        ))
        .sort((a, b) => b[0] - a[0])
        .slice(0, _limit);

      // 小的在前
      const sellArrFull = _.map(sellMap, ({ price, amount, volValue }) => {
        return [price, amount, volValue];
      });
      const sellArr = _.map(sellArrFull, item => [...item])
        .filter(item => (
          item[1] > 0 &&
          item[2] > 0
        ))
        .sort((a, b) => a[0] - b[0])
        .slice(0, _limit);

      yield put({
        type: 'updateFullData',
        payload: { coinPair: symbol, type: 'buy', orders: buyArrFull },
      });
      yield put({
        type: 'updateFullData',
        payload: { coinPair: symbol, type: 'sell', orders: sellArrFull },
      });
      yield put({
        type: 'updateOrders',
        payload: { coinPair: symbol, type: 'buy', orders: buyArr },
      });
      yield put({
        type: 'updateOrders',
        payload: { coinPair: symbol, type: 'sell', orders: sellArr },
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
