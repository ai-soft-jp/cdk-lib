/* CloudFront Simple Redirector */

/* global TARGET KEEP_PATH STATUS_CODE */

/**
 * @param {AWSCloudFrontFunction.Event} event
 * @returns {AWSCloudFrontFunction.Response|AWSCloudFrontFunction.Request}
 */
function handler(event) {
  const request = event.request;
  let location = TARGET;
  if (KEEP_PATH) {
    location = keepPath(location, request);
  }
  return {
    statusCode: STATUS_CODE ?? 301,
    headers: { location: { value: location } },
  };
}

/**
 * @param {string} location
 * @param {AWSCloudFrontFunction.Request} request
 * @returns {string}
 */
function keepPath(location, request) {
  const query = request.rawQueryString();
  location = location.replace(/\/$/, '') + request.uri;
  if (query != null) location += `?${query}`;
  return location;
}
