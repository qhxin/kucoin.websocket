
// api host
let _apiHost = 'kitchen.kucoin.com';

// ws message cycle interval (ms)
let _wsMessageInterval = 300;


//--------------------------------------------------------------
export const setApiHost = (host) => {
  _apiHost = host;
};
export const getApiHost = () => _apiHost;

export const setWsMessageInterval = (ms) => {
  _wsMessageInterval = ms;
};
export const getWsMessageInterval = () => _wsMessageInterval;


export {
};
