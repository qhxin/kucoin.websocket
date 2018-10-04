import { pull } from '../utils/request';

export async function getCurrencies(coins = []) {
  return pull('/v1/open/currencies', {
    coins: coins.join(','),
  });
}

export async function getServerTime() {
  return pull('/v1/open/chart/time');
}

export async function getMarketAreas() {
  return pull('/v1/open/markets');
}
