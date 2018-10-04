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
  return app;

  function start() {
    if (!app._store) {
      oldAppStart.call(app);
    }
  }
}
