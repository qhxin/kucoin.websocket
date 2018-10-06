import delay from '../../utils/delay';
import extend from 'dva-model-extend';
import wsInterface from '../common/ws';
import { getWsMessageInterval } from '../../config';
import {
  ws,
  modelRegister,
  EFFECT_RESTART,
  EFFECT_CONNECTED,
  EFFECT_RECONNECTED,
} from '../../utils/ws';
import {
  connectHandler,
  reconnectHandler,
  errorHandler,
  messageListener,
} from './handler';

// connect id
let _connectId = 0;

let _hasInit = false;
let _hasWsMessageDispatch = false;

export default extend(wsInterface, {
  namespace: 'wsListener',
  effects: {
    // 连接建立和管理
    *_wsInit({
      type,
      payload: { prevConnectId = false } = {},
    }, { put, race, take, call, fork }) {
      // get Socket instance
      let reconnect = false;
      if (prevConnectId === _connectId) {
        _connectId += 1;
        reconnect = true;
      }
      const socket = yield ws(reconnect);

      // 客户端主要事件进程，不会自己结束
      const clientProcess = function *clientProcess() {
        // 等待连接成功
        const connectProcess = function *connectProcess() {
          yield connectHandler(socket);
          // listen message
          messageListener.onMessage(socket);

          yield put({
            type: reconnect ? EFFECT_RECONNECTED : EFFECT_CONNECTED,
          });
        };
        // 等待连接错误发生
        const errorProcess = function *errorProcess() {
          const err = yield errorHandler(socket);
          console.error(err);
          yield put({ type: EFFECT_RESTART });
        };
        // 等待重连
        const task = yield fork(function *reconnectProcess() {
          yield reconnectHandler(socket);
          yield put({
            type: EFFECT_RECONNECTED,
          });
        });

        // 连接周期内，不退出
        yield [
          connectProcess(),
          errorProcess(),
        ];

        if (task.isRunning()) {
          task.cancel();
        }
      };

      // 要么连接出错，要么手动重连，否则不会结束
      yield race([
        clientProcess(),
        take(EFFECT_RESTART),
      ]);

      yield call(delay, 1000);

      // 无论如何，发生失败，都重建连接
      yield put({
        type: '_wsInit',
        payload: {
          prevConnectId: _connectId,
        },
      });
    },
    // 统一分发消息 message cycle
    *_wsMessageDispatch({ payload = {} }, { put, call }) {
      while (true) {
        const messagesArr = messageListener.takeMessages();
        for (let i = messagesArr.length - 1; i >= 0; i--) {
          const [topic, subscribe, messages] = messagesArr[i];
          const { messageHandler, params } = subscribe;

          const models = modelRegister.getModels(messageHandler);

          // 分发消息
          for (let j = models.length - 1; j >= 0; j--) {
            yield put({
              type: `${models[j]}/${messageHandler}`,
              payload: messages,
              topic,
              params,
            });
          }
        }

        const _ms = getWsMessageInterval();
        yield call(delay, _ms);
      }
    },
  },
  subscriptions: {
    wsInit({ dispatch }) {
      // init 只处理一次就行了
      if (!_hasInit) {
        _hasInit = true;
        dispatch({ type: '_wsInit' });
      }
    },
    wsMessageDispatch({ dispatch }) {
      if (!_hasWsMessageDispatch) {
        _hasWsMessageDispatch = true;
        dispatch({
          type: '_wsMessageDispatch',
        });
      }
    },
  },
});
