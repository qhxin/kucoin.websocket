import { delay } from 'dva/saga';
import extend from 'dva-model-extend';
import { maxPrecision } from '../config';
import base from './common/base';
import { getCoinsCategory } from '../services/market';
import precision from '../utils/precision';
import { numberFixed } from '../helper';

const createDecimals = (decimalPrecision) => {
  const decimals = [];
  while (decimals.length < 4 && decimalPrecision > 0) {
    decimals.push({
      length: decimalPrecision,
      group: Math.pow(10, maxPrecision - decimalPrecision),
    });
    decimalPrecision -= 1;
  }

  return decimals;
};

export default extend(base, {
  namespace: 'categories',
  state: {},
  reducers: {},
  effects: {
    *pull({ payload = {} }, { call, put }) {
      try {
        const { data } = yield call(getCoinsCategory);
        const map = {};

        data.forEach((item) => {
          item.tradePrecision = item.tradePrecision || maxPrecision;
          precision(item.coin, item.tradePrecision);
          const newItem = {
            ...item,
            key: item.coin,
            step: numberFixed(1 / Math.pow(10, item.tradePrecision)),
            decimals: createDecimals(item.tradePrecision),
          };
          map[item.coin] = newItem;
        });

        yield put({ type: 'reset', payload: map });
      } catch (e) {
        yield call(delay, 3000);
        yield put({ type: 'pull' });
      }
    },
  },
  subscriptions: {
    setUp({ dispatch }) {
      dispatch({ type: 'pull' });
    },
  },
});
