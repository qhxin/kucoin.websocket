import qs from 'qs';
import fetch from 'isomorphic-fetch';
import apiHost from './apiHost';
import { formlize } from '../helper';

// open 请求不传c
const openReg = /^(\/v1(\/account|\/user|\/api|\/market)?\/open)/;

let csrf = ''; // csrf id
const host = apiHost();

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  const error = new Error(response.statusText);
  error.response = response;
  throw error;
}

function parseJSON(response) {
  return response.json();
}

function checkError(json) {
  if (json.success === false) {
    throw json;
  }

  return json;
}

function isDefaultHost(url) {
  return url.indexOf('/') === 0 && url.indexOf('//') !== 0;
}

function isAPI(url) {
  return isDefaultHost(url);
}

export function setCsrf(value = '') {
  csrf = value;
}

/**
 * Requests a URL, returning a promise.
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [options] The options we want to pass to "fetch"
 * @return {object}           An object containing either "data" or "err"
 */
export default function request(url, options = {}) {
  options.mode = options.mode || 'cors';
  options.credentials = options.credentials || 'include';
  options.headers = {
    Accept: 'application/json',
    ...options.headers,
  };

  return fetch(isDefaultHost(url) ? `//${host}${url}` : url, options)
    .then(checkStatus)
    .then(parseJSON)
    .then(checkError);
}

/**
 * Get.
 *
 * @param {string} url
 * @param {object} query
 * @return {object} An object containing either "data" or "err"
 */
export function pull(url, query = {}) {
  if (isAPI(url)) {
    if (!openReg.test(url)) {
      query.c = csrf;
    }
  }
  let queryStr = qs.stringify(query) || '';
  if (queryStr) {
    if (url.indexOf('?') === -1) {
      queryStr = `?${queryStr}`;
    } else {
      queryStr = `&${queryStr}`;
    }
  }

  return request(`${url}${queryStr}`, {
    method: 'GET',
  });
}

/**
 * Post.
 *
 * @param {string} url
 * @param {object} data
 * @return {object} An object containing either "data" or "err"
 */
export function post(url, data = {}) {
  let queryStr = '';
  if (isAPI(url)) {
    const query = {};
    if (!openReg.test(url)) {
      query.c = csrf;
    }
    queryStr = qs.stringify(query);
    if (url.indexOf('?') === -1) {
      queryStr = `?${queryStr}`;
    } else {
      queryStr = `&${queryStr}`;
    }
  }
  return request(`${url}${queryStr}`, {
    method: 'POST',
    body: formlize(data),
  });
}

/**
 * Delete.
 *
 * @param {string} url
 * @param {object} query
 * @return {object} An object containing either "data" or "err"
 */
export function del(url, query = {}) {
  if (isAPI(url)) {
    if (!openReg.test(url)) {
      query.c = csrf;
    }
  }
  let queryStr = qs.stringify(query) || '';
  if (queryStr) {
    if (url.indexOf('?') === -1) {
      queryStr = `?${queryStr}`;
    } else {
      queryStr = `&${queryStr}`;
    }
  }

  return request(`${url}${queryStr}`, {
    method: 'DELETE',
  });
}
