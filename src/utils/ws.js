import _ from 'lodash';
import delay from './delay';
import io from 'socket.io-client';
import pathToRegexp from 'path-to-regexp';
import { pull } from './request';

// resource code to export
export const RESOURCE_H5 = 'h5';
export const RESOURCE_WEB = 'web';
export const RESOURCE_API = 'api';

// init server list manager
const _instanceServers = _initServers();
const _historyServers = _initServers();

// init wait event
const _waitEvent = _initWaitQueue();

// model register
const modelRegister = _registerMap();

// userLogin 后获取连接 token
let _bulletToken = null;

// resource is web or h5, default api
let _resource = RESOURCE_WEB;

// socket instance
let _socket = null;
let _init = false;

// dispatch subscribe and unsubscribe
// 告诉业务模型订阅和取消订阅的时机

// effects
export const EFFECT_RESTART = 'ws/wsRestart';
export const EFFECT_CONNECTED = 'ws/wsConnected';
export const EFFECT_RECONNECTED = 'ws/wsReconnected';

export const effectUnsubscribed = topic => `ws/wsUnSubscribed@${topic}@end`;
export const effectSubscribed = topic => `ws/wsSubscribed@${topic}@end`;
export const subscribedReducerName = reducerName => `${reducerName}@wsSubscribed`;
export const unsubscribedReducerName = reducerName => `${reducerName}@wsUnSubscribed`;

// 获取服务器地址和bulletToken
// 后续访问即时消息服务器或历史消息服务器时，需要使用这里返回的地址和bulletToken
async function userLogin() {
  try {
    const {
      data: {
        bulletToken,
        instanceServers = [],
        historyServers = [],
      } = {},
    } = await pull('/v1/bullet/usercenter/loginUser', {
      protocol: 'socket.io', // 获取socket.io的消息服务器，如果是原生实现，则可以换成websocket
    });

    _bulletToken = bulletToken;
    _instanceServers.set(instanceServers);
    _historyServers.set(historyServers);

    console.log('[ws entry] login bullet success.');
  } catch (e) {
    console.error(e);
    // 发生错误重新获取
    await delay(3000);
    await userLogin();
  }
}

// init
async function initIO() {
  async function preprocess() {
    let server = _instanceServers.getOne();
    while (!server) {
      await userLogin();
      server = _instanceServers.getOne();
    }
    const { endpoint } = server;

    if (!_resource || !endpoint || !_bulletToken) {
      throw new Error('Invalid WebSocket Args');
    }
    console.log('[ws entry] choose server: ', server);
    return {
      endpoint,
      resource: _resource,
      bulletToken: _bulletToken,
    };
  }

  try {
    const { endpoint, resource, bulletToken } = await preprocess();
    console.log('[ws entry] init io.');
    /*
      options (Object)
        path (String) name of the path that is captured on the server side (/socket.io)
        reconnection (Boolean) whether to reconnect automatically (true)
        reconnectionAttempts (Number) number of reconnection attempts before giving up (Infinity)
        reconnectionDelay (Number) how long to initially wait before attempting a new
        reconnection (1000). Affected by +/- randomizationFactor,
          for example the default initial delay will be between 500 to 1500ms.
        reconnectionDelayMax (Number) maximum amount of time to wait between
        reconnections (5000). Each attempt increases the reconnection delay by 2x
          along with a randomization as above
        randomizationFactor (Number) (0.5), 0 <= randomizationFactor <= 1
        timeout (Number) connection timeout before a connect_error
          and connect_timeout events are emitted (20000)
        autoConnect (Boolean) by setting this false, you have to call manager.open
          whenever you decide it's appropriate
        query (Object): additional query parameters that are sent when connecting a namespace (then found in socket.handshake.query object on the server-side)
        parser (Parser): the parser to use. Defaults to an instance of the Parser that ships with socket.io. See socket.io-parser.
    */
    return io(`${endpoint}?bulletToken=${encodeURIComponent(bulletToken)}&format=json&resource=${resource}`, {
      reconnectionDelay: 3000,
      forceNew: true,
      transports: ['websocket'],
    });
  } catch (e) {
    console.error(e);
    return await initIO();
  }
}

// ws instance
async function ws(reconnect = false) {
  if (reconnect || _socket === null) {
    if (reconnect && _socket) {
      // 关闭上次连接
      try {
        _socket.disconnect();
      } catch (e) {
        console.error(e);
      }
    }
    if (reconnect) {
      _init = false;
    }
    if (!_init) {
      _init = true; // 只允许一个init
      _socket = await initIO();
      _waitEvent.emit();
    } else if (_socket === null) {
      // wait socket to init
      await waitForSocketInit();
    }
  }
  return _socket;
}

/**
 * 等待 socket 被赋值
 */
async function waitForSocketInit() {
  return new Promise((resolve) => {
    _waitEvent.wait(() => {
      if (_socket) {
        resolve(_socket);
      }
    });
  });
}

/**
 * 等待触发队列
 */
function _initWaitQueue() {
  let queue = [];
  return {
    wait: (fn) => {
      if (typeof fn !== 'function') {
        console.log('[_initWaitQueue] invalid wait fn');
        return;
      }
      queue.push(fn);
    },
    emit: () => {
      _.each(queue, (fn) => {
        fn();
      });
      // clear queue
      queue = [];
    },
  };
}

/**
 * 设置 wx 连接的 resource
 * @param {*} resource
 */
function setResource(resource) {
  _resource = resource;
}

/**
 * 服务节点列表
 * set 用于存入一批节点并打乱顺序
 * getOne 取出并从原列表中摘掉
 */
function _initServers() {
  let _servers = [];

  return {
    set: (list) => {
      if (!_.isArray(list) || !list.length) {
        throw new Error('Invalid Servers List');
      }
      _servers = _.shuffle(list);
    },
    getOne: () => {
      return _servers.shift();
    },
  };
}

/**
 * 注册模型
 */
function _registerMap() {
  const register = {};

  const setModel = (model, handle) => {
    if (register[handle]) {
      register[handle].push(model);
    } else {
      register[handle] = [model];
    }
  };

  const getModels = (handle) => {
    return register[handle];
  };

  return {
    setModel,
    getModels,
  };
}

/**
 * 检查消息错误
 * @param {*} result
 */
function checkError(result) {
  if (!result) {
    throw new Error('Empty Result');
  }
  const { type } = result;
  if (type !== 'ack') {
    throw new Error('Result Type Error');
  }
  return result;
}

/**
 * 统一最终数据到达的model接口名
 * @param {*} reducerName
 */
function finalReducerName(reducerName) {
  return reducerName.replace(/^(.+)Reducer$/, '$1FinalReducer');
}

// 解析路由
// 匹配返回变量map
// 不匹配返回false
export const _matchRoute = (template, path) => {
  const keys = [];
  const reg = pathToRegexp(template, keys);

  const match = reg.exec(path);
  if (!match) {
    return false;
  }
  const [url, ...values] = match; // eslint-disable-line no-unused-vars
  const params = keys.reduce((memo, key, index) => {
    memo[key.name] = values[index];
    return memo;
  }, {});
  return params;
};

// 解析通道模板，将变量填入模板
export const parseTopic = (template, params) => {
  let str = template;
  _.map(params, (value, key) => {
    const re = new RegExp(`{${key}}`, 'g');
    str = str.replace(re, value);
  });
  return str;
};

export {
  ws,
  setResource,
  checkError,
  finalReducerName,
  modelRegister,
};
