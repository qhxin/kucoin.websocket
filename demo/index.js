/**
 * nodejs runtime demo
 */
// -> using npm package
// import kucoinWs from 'kucoin.websocket';
// -> using demo
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
    console.log('ts', ts, JSON.stringify({
      dealOrders: state.dealOrders,
      market_KCS_BTC: state.market.coinPairMap['KCS-BTC'],
      openOrders: state.openOrders,
    }));

    await delay(10000);
  }
}
demoCycleProcess();
