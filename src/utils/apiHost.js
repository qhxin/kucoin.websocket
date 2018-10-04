import { getApiHost } from '../config';

let _host = null;

export default () => {
  if (_host) {
    return _host;
  }

  try {
    const apiHost = getApiHost();
    if (apiHost) {
      _host = apiHost;
      return _host;
    }
  } catch (e) {
    console.log(e);
  }
};
