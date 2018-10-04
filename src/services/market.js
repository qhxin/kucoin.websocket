import { pull, post } from '../utils/request';

/**
 * 获取货币对的挂单记录
 * 最多30条记录
 *
 * @param coinPair
 * @param limit
 * @param group
 * @returns {Object}
 */
export async function getOrders(coinPair, limit, group) {
  return pull(`/v1/open/orders?symbol=${coinPair || ''}`, { limit, group });
}

/**
 * 获取货币对的销售挂单
 *
 * @param coinPair
 * @param limit
 * @param group
 * @returns {Object}
 */
export async function getSellOrders(coinPair, limit, group) {
  return pull(`/v1/open/orders-sell?symbol=${coinPair || ''}`, { limit, group });
}

/**
 * 获取货币对的购买挂单
 *
 * @param coinPair
 * @param limit
 * @param group
 * @returns {Object}
 */
export async function getBuyOrders(coinPair, limit, group) {
  return pull(`/v1/open/orders-buy?symbol=${coinPair || ''}`, { limit, group });
}

/**
 * 最近成交记录
 * 最多50条记录,时间降序排列
 *
 * @param coinPair
 * @param limit
 * @param since
 * @returns {Object}
 */
export async function getDealOrders(coinPair, limit, since) {
  return pull(`/v1/open/deal-orders?symbol=${coinPair || ''}`, { limit, since });
}

/**
 * 所有币种的当前概览
 *
 * @returns {Object}
 */
export async function getCoins(market) {
  return pull('/v1/market/open/symbols', { market });
}

/**
 * 所有币种的当前趋势
 *
 * @returns {Object}
 */
export async function getCoinsTrending() {
  return pull('/v1/market/open/coins-trending');
}

/**
 * 获取货币对的蜡烛图 (K-Line)
 *
 * @param coinPair
 * @param type
 * @param since
 * @param limit
 * @returns {Object}
 */
export async function getKline(coinPair, type, since, limit) {
  return pull(`/v1/open/kline?symbol=${coinPair || ''}`, { type, since, limit });
}

/**
 * 获取所有币种
 *
 * @returns {Object}
 */
export async function getCoinsCategory() {
  return pull('/v1/market/open/coins');
}

/**
 * 交易对的实时快照
 *
 * @param coinPair
 * @returns {Object}
 */
export async function getCoinPairTick(coinPair) {
  return pull(`/v1/open/tick?symbol=${coinPair || ''}`);
}

/**
 * 交易量排名
 *
 * @param symbol
 * @param since
 * @param before
 * @returns {Object}
 */
export async function getDealtRank(symbol, since, before) {
  return pull(`/v1/dealt-rank?symbol=${symbol || ''}`, {
    since,
    before,
  });
}

/**
 * 获取用户置顶交易对列表
 */
export async function getUserStickSymbols() {
  return pull('/v1/market/stick-symbols');
}

/**
 * 获取用户自选交易对列表
 */
export async function getUserFavSymbols() {
  return pull('/v1/market/fav-symbols');
}

/**
 * 设置或取消用户自选交易对列表
 * @param symbol string 交易对
 * @param fav bool
 */
export async function userFavSymbols({ symbol, fav }) {
  fav = fav ? 1 : 0;
  return post(`/v1/market/symbol/fav?symbol=${symbol || ''}`, { fav });
}

/**
 * 设置或取消用户置顶交易对列表
 * @param symbol string 交易对
 * @param stick bool
 */
export async function userStickSymbols({ symbol, stick }) {
  stick = stick ? 1 : 0;
  return post(`/v1/market/symbol/stick?symbol=${symbol || ''}`, { stick });
}
