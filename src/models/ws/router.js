// config start
// =========================================================

/**
 * 通道说明
 *   格式：[通道名模板,消息处理effect名]
 *   通道名模板里的变量和路由里的变量保持一致
 *   消息处理effect主要在wsReducer那一层预处理业务数据，之后才给业务model处理
 */
let wsTopic = {
  // market tick数据
  MARKET_TICK: [
    '/market/{symbol}_TICK', // 通道名
    'wsMarketTickReducer', // 消息处理
  ],
  TRADE_HISTORY: [
    '/trade/{symbol}_HISTORY',
    'wsTradeHistoryReducer',
  ],
  // 市场数据
  MARKET: [
    '/market/{area}',
    'wsMarketReducer',
  ],
  // 买卖盘数据
  TRADE: [
    '/trade/{symbol}_TRADE',
    'wsTradeReducer',
  ],
};

/**
 * 路由对应通道，变量名会被匹配并用于提供给通道名的格式化
 */
let wsRouterGroup = {
  '/trade.pro/:symbol': [
    wsTopic.MARKET_TICK,
    wsTopic.TRADE_HISTORY,
    wsTopic.TRADE,
  ],
  '/trade/:symbol': [ // 路由
    wsTopic.MARKET_TICK,
    wsTopic.TRADE_HISTORY,
    wsTopic.TRADE,
  ],
  '/': [
    wsTopic.MARKET,
  ],
  '/markets': [
    wsTopic.MARKET,
  ],
};

// =========================================================
// config end

// 外部业务项目增加配置用
const appendWsTopic = (topic) => {
  wsTopic = {
    ...wsTopic,
    ...topic,
  };
};

// 外部业务项目增加配置用
const appendWsRouter = (router) => {
  wsRouterGroup = {
    ...wsRouterGroup,
    ...router,
  };
};

export default {
  wsRouter: wsRouterGroup,
  wsTopic,
  appendWsTopic,
  appendWsRouter,
};
