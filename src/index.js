import * as core from 'dva-core';

require('es6-promise').polyfill();

export default function (opts = {}) {
  const createOpts = {
    initialReducer: {},
    setupMiddlewares(middlewares) {
      return [
        ...middlewares,
      ];
    },
  };

  const app = core.create(opts, createOpts);
  const oldAppStart = app.start;
  app.start = start;

  app.model(require('./models/categories'));
  app.model(require('./models/dealOrders'));
  app.model(require('./models/market'));
  app.model(require('./models/openOrders'));
  app.model(require('./models/app'));
  app.model(require('./models/ws/wsListener'));

  return app;

  function start() {
    if (!app._store) {
      oldAppStart.call(app);
    }
  }
}
