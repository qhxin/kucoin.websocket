/**
 * nodejs runtime demo
 */
import kucoinWs from '../lib/index';
import delay from '../lib/utils/delay';

// Initialize
const app = kucoinWs();

// use models
// app.model(require('./testModel'));

app.start();

/*
// test model process
async function testModelProcess() {
  while (true) {
    const ts = Date.now();
    console.log('ts', ts, app._store.getState());

    app._store.dispatch({ type: 'testModel/updateCount' });

    await delay(1000);
  }
}
testModelProcess();
*/

async function demoCycleProcess() {
  while (true) {
    const ts = Date.now();
    const state = app._store.getState();
    console.log('ts', ts, {
      dealOrders: state.dealOrders,
      market: state.market,
      openOrders: state.openOrders,
    });

    await delay(10000);
  }
}
demoCycleProcess();
