/**
 * nodejs runtime demo
 */
import kucoinWs from '../lib/index';
// import delay from '../lib/utils/delay';

// Initialize
const app = kucoinWs();

// use models
// app.model(require('./testModel').default);

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
