import delay from '../../utils/delay';
import extend from 'dva-model-extend';
import base from './base';
import {
  ws,
  modelRegister,
  effectUnsubscribed,
  effectSubscribed,
  subscribedReducerName,
  unsubscribedReducerName,
  EFFECT_RECONNECTED,
} from '../../utils/ws';
import {
  subscribeHandler,
  unSubscribeHandler,
  messageListener,
} from '../ws/handler';

// subscribed
const _subscribed = {};

export default extend(base, {

  effects: {
    // 订阅通道
    *_wsSubscribe({ payload }, { put, take, race, call }) {
      const { topic, messageHandler, params, pathname } = payload;
      if (!topic) {
        throw new Error('Invalid Topic');
      }

      // get Socket instance
      const socket = yield ws();

      // 完成订阅
      try {
        // 订阅 emit 一次就行了
        // if has been subscribed, continue
        if (!_subscribed[topic]) {
          // 添加订阅标志
          _subscribed[topic] = true;
          yield subscribeHandler(socket, topic);

          messageListener.subscribeDispatch(topic, { messageHandler, params, pathname });
          console.log('subscribe', topic);

          const models = modelRegister.getModels(messageHandler);
          // 分发订阅成功消息
          const subscribedEffect = subscribedReducerName(messageHandler);
          for (let j = models.length - 1; j >= 0; j--) {
            yield put({
              type: `${models[j]}/${subscribedEffect}`,
            });
          }
        }

        // 此次订阅完成
        yield put({ type: effectSubscribed(topic) });

        const { reconn } = yield race({ // eslint-disable-line no-unused-vars
          reconn: take(EFFECT_RECONNECTED),
          unsubscribe: take(effectUnsubscribed(topic)),
        });
        if (reconn) {
          throw new Error('reconnect');
        }
      } catch (e) {
        delete _subscribed[topic];
        console.error(e);

        // 重建连接或者其他异常后重新订阅
        yield call(delay, 1000);

        // 重新订阅
        yield put({
          type: '_wsSubscribe',
          payload,
        });
      }
    },
    // 取消订阅通道
    *_wsUnSubscribe({ payload }, { put, call }) {
      const { topic, messageHandler } = payload;
      if (!topic) {
        throw new Error('Invalid Topic');
      }

      // get Socket instance
      const socket = yield ws();

      try {
        // 一个 topic 只取消一次
        // if has been unsubscribed, continue
        if (_subscribed[topic]) {
          // 去掉订阅标志
          delete _subscribed[topic];
          yield unSubscribeHandler(socket, topic);

          messageListener.unsubscribeDispatch(topic);
          console.log('unsubscribe', topic);

          const models = modelRegister.getModels(messageHandler);
          // 分发取消订阅成功消息
          const unsubscribedEffect = unsubscribedReducerName(messageHandler);
          for (let j = models.length - 1; j >= 0; j--) {
            yield put({
              type: `${models[j]}/${unsubscribedEffect}`,
            });
          }
        }
        // 取消之后，通知所有模型关闭对应 topic 的消息监听
        yield put({ type: effectUnsubscribed(topic) });
      } catch (e) {
        _subscribed[topic] = true;
        console.error(e);

        yield call(delay, 1000);
        yield put({
          type: '_wsUnSubscribe',
          payload,
        });
      }
    },
    *wsRegister({ type, payload }) {
      const _namespace = type.split('/')[0];
      modelRegister.setModel(_namespace, payload);
    },
  },
});
