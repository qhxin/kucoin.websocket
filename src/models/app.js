import _ from 'lodash';
import extend from 'dva-model-extend';
import base from './common/base';
import {
  _matchRoute,
  parseTopic,
  effectSubscribed,
} from '../utils/ws';
import topicMap from './ws/topics';
import { templateToRouter } from '../helper';
import {
  getWsSubTopics,
  getOpenOrdersLimit,
  getDealOrdersLimit,
} from '../config';

const openOrdersLimit = getOpenOrdersLimit();
const dealOrdersLimit = getDealOrdersLimit();

/**
 * 订阅默认通道
 */
export default extend(base, {
  namespace: 'app',
  effects: {
    *run({ payload = {} }, { put, take }) {
      console.log('[app] ws app start');
      console.log('[app] waiting meta data loading...');
      yield [
        take('market/pullAreas/@@end'),
        take('categories/pull/@@end'),
      ];
      console.log('[app] meta data loaded');

      const cfgSubs = getWsSubTopics();
      const parseArr = _.map(topicMap, (item, key) => [templateToRouter(item[0]), key]);
      const cfgSubsLen = cfgSubs.length;
      const parseArrLen = parseArr.length;

      for (let i = 0; i < cfgSubsLen; i++) {
        const subTopic = cfgSubs[i];

        // 匹配对应通道
        let find = false;
        for (let j = 0; j < parseArrLen; j++) {
          const [template, topicKey] = parseArr[j];

          const params = _matchRoute(template, subTopic);
          if (params) {
            console.log('[app] topic matched');
            const [topicTemplate, messageHandler] = topicMap[topicKey];

            // put vars into topic
            const topic = parseTopic(topicTemplate, params);

            console.log('[app] topic subscribe');
            // 订阅
            yield put({
              type: 'wsListener/_wsSubscribe',
              payload: {
                topic,
                params,
                messageHandler,
              },
            });
            yield take(effectSubscribed(topic));
            console.log('[app] subscribe end.', topic);

            if (topicKey === 'TRADE') {
              yield put({
                type: 'openOrders/pull@polling',
                payload: { coinPair: params.symbol, limit: openOrdersLimit },
              });
              console.log('[app] polling openOrders/pull end.');
            } else
            if (topicKey === 'TRADE_HISTORY') {
              yield put({
                type: 'dealOrders/pull@polling',
                payload: { coinPair: params.symbol, limit: dealOrdersLimit },
              });
              console.log('[app] polling dealOrders/pull end.');
            } else
            if (topicKey === 'MARKET') {
              yield put({ type: 'market/filter@polling', payload: { area: params.area } });
              console.log('[app] polling market/filter end.');
            } else
            if (topicKey === 'MARKET_TICK') {
              yield put({ type: 'ticks/pull', payload: { coinPair: params.symbol } });
              console.log('[app] polling ticks/pull end.');
            }

            // next cfg topic
            find = true;
            break;
          }
        }

        if (!find) {
          console.log('[app] can\'t match topic: ', subTopic);
        }
      }

      console.log('[app] run end.');
    },
  },
  subscriptions: {
    setUp({ dispatch }) {
      dispatch({ type: 'run' });
    },
  },
});
