import _ from 'lodash';
import { checkError } from '../../utils/ws';
// Socket 事件处理

// 消息自增
let _seq = 0;

// 连接建立
const connectHandler = (socket) => {
  return new Promise((resolve) => {
    socket.on('connect', () => resolve());
  });
};

// 重连
const reconnectHandler = (socket) => {
  return new Promise((resolve) => {
    socket.on('reconnect', () => resolve());
  });
};

// 出错
const errorHandler = (socket) => {
  return new Promise((resolve) => {
    socket.on('error', error => resolve(error));
    socket.on('connect_error', error => resolve(error));
    socket.on('reconnect_error', error => resolve(error));
    socket.on('reconnect_failed', () => resolve(new Error('Reconnect Failed')));
  });
};

// 订阅
const subscribeHandler = (socket, topic) => {
  return new Promise((resolve, reject) => {
    if (!socket.connected) {
      reject('socket has not connected');
    } else {
      socket.emit('subscribe', topic, (result) => {
        resolve(result);
      });
    }
  }).then(checkError);
};

// 取消订阅
const unSubscribeHandler = (socket, topic) => {
  return new Promise((resolve, reject) => {
    if (!socket.connected) {
      reject('socket has not connected');
    } else {
      socket.emit('unsubscribe', topic, (result) => {
        resolve(result);
      });
    }
  }).then(checkError);
};

// 校准判定，主要用于全量轮询和ws之间的数据通过时机的判定
// ws数据订阅后，在全量回来后，记录全量到达时的seq，然后在ws数据最终处理时，抛弃掉这个seq之前的数据
// 订阅需要在reducer model触发注册校准判定
// 取消订阅清空校准判定的注册状态
// 以后新的ws版本的校准逻辑也可以在这里修改
const adjustmentManager = (() => {
  const managerMap = Object.create(null);

  // 注册判定条件
  const register = (namespace) => {
    managerMap[namespace] = {
      _nearPollSeq: 0,
    };
  };

  // 清空判定条件
  const clear = (namespace) => {
    delete managerMap[namespace];
  };

  // 判定轮询数据是否可用
  const passPull = (namespace) => {
    if (!managerMap[namespace]) {
      register(namespace);
    }

    const manager = managerMap[namespace];
    manager._nearPollSeq = _seq;
    return true;
  };

  // 判定ws数据是否可用
  const passWs = (namespace) => {
    if (!managerMap[namespace]) {
      register(namespace);
    }

    const manager = managerMap[namespace];
    return manager._nearPollSeq;
  };

  return {
    register,
    clear,
    passPull,
    passWs,
  };
})();

// 消息
const messageListener = (() => {
  let messageCache = Object.create(null);

  // 订阅信息
  const dispatchMap = Object.create(null);

  // 获取缓存的消息
  const takeMessages = () => {
    const messageArr = _.map(messageCache, (messages, topic) => {
      const subscribe = dispatchMap[topic];
      return [topic, subscribe, messages];
    });

    messageCache = Object.create(null);
    return messageArr;
  };

  const _cacheMessage = (topic, data) => {
    if (messageCache[topic]) {
      messageCache[topic].push(data);
    } else {
      messageCache[topic] = [data];
    }
  };

  // 订阅的通道信息
  const subscribeDispatch = (topic, payload) => {
    dispatchMap[topic] = payload;
  };

  // 取消订阅
  const unsubscribeDispatch = (topic) => {
    delete dispatchMap[topic];
    delete messageCache[topic];
  };

  // 消息事件
  const onMessage = (socket) => {
    socket.on('message', (data) => {
      const { seq, topic, type } = data;
      // 只处理有topic并且type为message的消息
      if (type !== 'message' || !topic) {
        return;
      }
      // 过时的消息不处理
      if (seq <= _seq) {
        return;
      }
      _seq = seq;
      _cacheMessage(topic, data);
    });
  };

  return {
    onMessage,
    takeMessages,
    subscribeDispatch,
    unsubscribeDispatch,
  };
})();

export default {
  connectHandler,
  reconnectHandler,
  errorHandler,
  subscribeHandler,
  unSubscribeHandler,
  messageListener,
  adjustmentManager,
};
