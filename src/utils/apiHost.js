import { apiHost } from '../config';

let _host = null;

export default () => {
  if (_host) {
    return _host;
  }

  try {
    if (apiHost) {
      _host = apiHost;
      return _host;
    }
  } catch (e) {
    console.log(e);
  }
};
