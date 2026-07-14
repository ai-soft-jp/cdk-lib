/* global VALUE */
/**
 * @param {AWSCloudFrontFunction.Event} event
 * @returns {AWSCloudFrontFunction.Request|AWSCloudFrontFunction.Response}
 */
function handler(event) {
  const request = event.request;
  request.headers['x-value'] = { value: VALUE };
  return request;
}
