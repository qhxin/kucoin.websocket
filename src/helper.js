import _ from 'lodash';
import moment from 'moment';
import Decimal from 'decimal.js/decimal';

const FormData = window.FormData;

/**
 * 高精度计算库
 */
export {
  Decimal,
};

/**
 * 时间戳格式化
 * @param timestamp
 * @param format
 * @returns {string}
 */
export const showDatetime = (timestamp, format = 'YYYY-MM-DD HH:mm:ss') => {
  return moment(timestamp).format(format);
};

/**
 * 字符串转时间戳
 * @param timestamp
 * @param format
 * @returns {string}
 */
export const timestamp = (date) => {
  if (moment(date).isValid()) {
    return moment(date).valueOf();
  }
  return null;
};

/**
 * 对象转表单数据
 * @param obj
 * @returns {*}
 */
export const formlize = (obj) => {
  if (obj instanceof FormData) {
    return obj;
  }
  const form = new FormData();
  _.each(obj, (value, key) => {
    if (typeof value !== 'undefined') {
      form.append(key, value);
    }
  });
  return form;
};

/**
 * 精简大位数，并增加千分位分隔符
 * @param value
 * @returns {*}
 */
export const readableNumber = (value) => {
  const million = 1000000;
  const number = parseFloat(value);

  if (isNaN(number)) {
    return value;
  }
  if (number < million) {
    return separateNumber(value);
  }

  return separateNumber(numberFixed(number, 2));
};

/**
 * 增加千分位分隔符
 * @param n
 * @returns {string}
 */
const SeparateNumberPool = {
  pool: Object.create(null),
  poolCount: 0,
  has(k) {
    return !!(this.pool[k]);
  },
  get(k) {
    return this.pool[k];
  },
  set(k, v) {
    if (this.poolCount > 100000) { // 清理缓存
      this.poolCount = 0;
      this.pool = Object.create(null);
    }
    if (!this.has(k)) {
      this.poolCount += 1;
    }
    this.pool[k] = v;
  },
};
export const separateNumber = (n) => {
  const num = numberFixed(n);

  if (SeparateNumberPool.has(num)) {
    return SeparateNumberPool.get(num);
  }
  if (!(/^[0-9.]+$/).test(num)) {
    return n;
  }

  let integer = num;
  let floater = '';
  if (num.indexOf('.') > -1) {
    const arr = num.split('.');
    integer = arr[0];
    floater = arr[1];
  }
  const len = integer.length;
  let parser = '';
  if (len > 3) {
    let count = 0;
    for (let i = len - 1; i >= 0; i -= 1) {
      parser = integer[i] + parser;
      count += 1;
      if (count % 3 === 0 && i > 0) {
        parser = `,${parser}`;
      }
    }
  } else {
    parser = integer;
  }
  if (floater !== '') {
    floater = `.${floater}`;
  }
  const r = `${parser}${floater}`;
  SeparateNumberPool.set(num, r);

  return r;
};

/**
 * 键值对转为值数组
 * @param map
 */
export const mapToArray = (map) => {
  return _.map(map, value => value);
};

/**
 * 高精度指定位数
 * @param v
 * @param decimal
 * @param round
 * @returns {*}
 */
export const numberFixed = (v, decimal, round = Decimal.ROUND_HALF_UP) => {
  if (typeof v !== 'number') {
    return v;
  }
  if (v === 0) {
    return '0';
  }
  return new Decimal(v).toFixed(decimal, round);
};

/**
 * 高精度乘法并取给定位数四舍五入
 * @param a
 * @param b
 * @param decimal
 * @param round
 * @returns {string|*}
 */
export const multiply = (a, b, decimal = 8, round = Decimal.ROUND_HALF_UP) => {
  return new Decimal(a).mul(b).toFixed(decimal, round);
};

/**
 * 高精度除法并取给定位数四舍五入
 * @param a
 * @param b
 * @param decimal
 * @param round
 * @returns {string|*}
 */
export const divide = (a, b, decimal = 8, round = Decimal.ROUND_HALF_UP) => {
  if (+b === 0) { // FIXME b === 0 时，Decimal.js 计算为 Infinity，这里按 0 来返回吧。。。
    return 0;
  }
  return new Decimal(a).div(b).toFixed(decimal, round);
};

/**
 * 将秒转化为 日、时、分、秒 四个部分
 * @param totalSeconds
 * @returns {[number,number,number,number]}
 */
export const getTimeData = (totalSeconds) => {
  const data = [0, 0, 0, 0];
  if (!totalSeconds) {
    return data;
  }

  data[0] = Math.floor(totalSeconds / (60 * 60 * 24)); // 天
  totalSeconds %= (60 * 60 * 24);
  data[1] = Math.floor(totalSeconds / 3600);  // 时
  totalSeconds %= 3600;
  data[2] = Math.floor(totalSeconds / 60);  // 分
  data[3] = totalSeconds % 60;  // 秒

  data[1] = _.padStart(data[1], 2, '0');
  data[2] = _.padStart(data[2], 2, '0');
  data[3] = _.padStart(data[3], 2, '0');

  return data;
};

/**
 * Array sort 保持顺序
 * @param arr
 * @param sorter
 * @returns {*}
 */
export const orderSort = (arr, sorter) => {
  if (arr && arr.length && sorter) {
    const mp = new Map();
    arr.forEach((item, index) => {
      mp.set(item, index);
    });

    return arr.sort((a, b) => {
      const sort = sorter(a, b);
      if (sort === 0) {
        return mp.get(a) - mp.get(b);
      } else {
        return sort;
      }
    });
  } else {
    return arr;
  }
};

/**
 * 随机取数组元素
 */
export const getRandomItem = (arr) => {
  if (!_.isArray(arr) || !arr.length) {
    return null;
  }

  return arr[_.random(0, arr.length - 1)];
};

/**
 * 移动数组元素，取遇到的第一个值相等的元素移动到头部或尾部
 * @param arr 数组
 * @param value 值
 * @param toFront 默认加到后面
 * @returns {*}
 */
export const mvArrayValue = (arr, value, toFront) => {
  const tmpArr = _.cloneDeep(arr);
  for (let i = 0; i < tmpArr.length; i++) {
    if (tmpArr[i] === value) {
      tmpArr.splice(i, 1);
      break;
    }
  }
  if (toFront) {
    tmpArr.unshift(value);
  } else {
    tmpArr.push(value);
  }
  return tmpArr;
};

/**
 * 返回数组的分页数据
 * @param pageNo    当前页
 * @param pageSize  每页大小
 * @param array     原始数组
 * @returns {Blob|ArrayBuffer|Array.<T>|string|*}
 */
export const getArrayPage = (pageNo, pageSize, array) => {
  const offset = (pageNo - 1) * pageSize;
  return (offset + pageSize >= array.length) ?
    array.slice(offset, array.length) : array.slice(offset, offset + pageSize);
};

/**
 * 字符串全部转同一个字符
 * @param str
 * @param pad
 * @returns {string}
 */
export const padString = (str, pad = '*') => {
  if (!str) {
    return '';
  }
  return (`${str}`).replace(/./g, pad);
};
