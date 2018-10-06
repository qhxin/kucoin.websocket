const precisionMap = {};

export default function (coin, precision = null) {
  if (typeof precision !== 'number') {
    return precisionMap[coin];
  }
  precisionMap[coin] = precision;
  return precision;
}

export const all = () => {
  return precisionMap;
};
