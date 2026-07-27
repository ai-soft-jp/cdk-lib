/* CloudFront Simple Redirector */
import cf from 'cloudfront';

/* global PREFIX_TARGETS FALLBACK_TARGET INDEX BASE_URL STATUS_CODE */

/**
 * @param {AWSCloudFrontFunction.Event} event
 * @returns {AWSCloudFrontFunction.Response|AWSCloudFrontFunction.Request}
 */
async function handler(event) {
  const request = event.request;
  const target = (await getMappedTarget(request)) || getPrefixTarget(request) || FALLBACK_TARGET;
  return {
    statusCode: STATUS_CODE ?? 301,
    headers: { location: { value: makeUrl(target, BASE_URL) } },
  };
}

/**
 * @param {AWSCloudFrontFunction.Request} request
 * @returns {string|undefined}
 */
function getPrefixTarget(request) {
  const target = PREFIX_TARGETS?.find((target) => request.uri.startsWith(target[0]));
  return target?.[1];
}

/**
 * @param {AWSCloudFrontFunction.Request} request
 * @returns {Promise<string|undefined>}
 */
async function getMappedTarget(request) {
  const kvs = cf.kvs();
  const index = INDEX?.find((s) => request.uri.endsWith(s));
  const path = index ? request.uri.slice(0, 1 - index.length) : request.uri;
  try {
    return await kvs.get(path);
  } catch (_err) {
    // return undefined
  }
}

/**
 * @param {string} location
 * @param {string} baseUrl
 * @returns {string}
 */
function makeUrl(location, baseUrl) {
  return /^\w+:/.test(location) ? location : baseUrl.replace(/\/$/, '') + location;
}
