# kucoin.websocket

This is a websocket library for KuCoin's open market datas. Don't need any API secrets or Auth tokens.

## Install

Npm: `npm install --save kucoin.websocket`

Or you can clone the codes from git and direct import to your demo.

## Usage

```
// import from package
import kucoinWs from 'kucoin.websocket';

// initialize
const app = kucoinWs();

// start
app.start();

// use state
const state = app._store.getState();
```

## Runtime

This Lib using dva-core and it provides a Redux Store to outside programs, no UI or Browser specific codes, so it can work on Node.js and Browsers. If you know how to use dva model and even redux-saga, it's better for you to fork and change models for yourself.

## Develop

### Step1.

clone from git

### Step2.

Change demo codes then `npm run demo`. Or write your codes and rebuild.

### Step3.

`npm run build`

# kucoin.websocket

这是一个使用 websocket 获取 KuCoin 公开市场数据的库。由于使用的是公开接口，所以不需要任何 API 密钥或者其他身份认证的 token。

## 安装

Npm: `npm install --save kucoin.websocket`

你也可以从 git 上克隆代码到你的项目里直接引用。使用方式参考demo。

## 使用

```
// import from package
import kucoinWs from 'kucoin.websocket';

// initialize
const app = kucoinWs();

// start
app.start();

// use state
const state = app._store.getState();
```

## 运行环境

这个库主要依赖 dva-core，它提供了一个 Redux Store 作为一个数据源，这个库就是负责通过 websocket 来更新这个数据源。所以你可以在外部程序直接使用这个库提供的 state，它没有其他 UI 或者浏览器相关的代码，你可以在 Node.js 或者浏览器环境使用这个库。如果你有 dva 的模型使用经验或者 redux-saga 的使用经验，可以 fork 这个库来添加自己需要的逻辑。

## 开发

### Step1.

从 git 克隆代码；

### Step2.

更改自带的 demo 的代码然后运行 `npm run demo`。 或者如果你有更多的改动，随便怎么改都行。

### Step3.

`npm run build`
