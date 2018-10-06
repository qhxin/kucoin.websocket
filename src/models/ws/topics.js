/**
 * 通道说明
 *   格式：[通道名模板,消息处理effect名]
 *   通道名模板里的变量和路由里的变量保持一致
 *   消息处理effect主要在wsReducer那一层预处理业务数据，之后才给业务model处理
 */
export default {
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
