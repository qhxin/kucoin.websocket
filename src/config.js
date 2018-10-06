
// api host
// let _apiHost = 'api.kucoin.com'; // 'kitchen.kucoin.com';
let _apiHost = 'kitchen.kucoin.com';

// ws message cycle interval (ms)
let _wsMessageInterval = 300;

// ws subscribe topics
// topic template is in models/ws/topics.js
let _wsSubTopics = [
  '/market/BTC',
  '/market/USDT',
  '/trade/KCS-BTC_TRADE',
  '/trade/KCS-BTC_HISTORY',
];

//--------------------------------------------------------------
export const setApiHost = (host) => {
  _apiHost = host;
};
export const getApiHost = () => _apiHost;

export const setWsMessageInterval = (ms) => {
  _wsMessageInterval = ms;
};
export const getWsMessageInterval = () => _wsMessageInterval;

export const setWsSubTopics = (arr) => {
  _wsSubTopics = arr;
};
export const getWsSubTopics = () => _wsSubTopics;

export {
};
