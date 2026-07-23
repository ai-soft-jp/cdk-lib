/* CloudFront Simple Redirector */
import cf from 'cloudfront';

/* global PREFIX_TARGETS FALLBACK_TARGET STATUS_CODE */

/**
 * @param {AWSCloudFrontFunction.Event} event
 * @returns {AWSCloudFrontFunction.Response|AWSCloudFrontFunction.Request}
 */
async function handler(event) {
  const request = event.request;
  const location = (await getMappedTarget(request)) || getPrefixTarget(request) || FALLBACK_TARGET;
  return {
    statusCode: STATUS_CODE ?? 301,
    headers: { location: { value: location } },
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
  if (await kvs.exists(request.uri)) {
    return await kvs.get(request.uri);
  }
}
