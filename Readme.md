# kucoin.websocket

This is a websocket library for KuCoin's open market datas. Don't need any API secrets or Auth tokens.

## Install

Npm: `npm install --save kucoin.websocket`

Or you can clone the codes from git and direct import to your demo.

## Runtime

This Lib using dva-core and it provides a Redux Store to outside programs, no UI or Browser specific codes, so it can work on Node.js and Browsers. If you know how to use dva model and even redux-saga, it's better for you to fork and change models for yourself.


# kucoin.websocket

这是一个使用 websocket 获取 KuCoin 公开市场数据的库。由于使用的是公开接口，所以不需要任何 API 密钥或者其他身份认证的 token。

## 安装

Npm: `npm install --save kucoin.websocket`

你也可以从 git 上克隆代码到你的项目里直接引用。使用方式参考demo。

## 运行环境

这个库主要依赖 dva-core，它提供了一个 Redux Store 作为一个数据源，这个库就是负责通过 websocket 来更新这个数据源。所以你可以在外部程序直接使用这个库提供的 state，它没有其他 UI 或者浏览器相关的代码，你可以在 Node.js 或者浏览器环境使用这个库。如果你有 dva 的模型使用经验或者 redux-saga 的使用经验，可以 fork 这个库来添加自己需要的逻辑。
