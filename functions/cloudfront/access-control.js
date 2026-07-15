/* CloudFront Access Control */

/* global __BASIC_AUTH __REMOTE_IP __SATISFY FORBIDDEN_HTML UNAUTHORIZED_HTML */
const BASIC_AUTH = __BASIC_AUTH;
const REMOTE_IP = __REMOTE_IP;
const SATISFY = __SATISFY;
const REMOTE_IPv4 = REMOTE_IP && REMOTE_IP[4] ? new RegExp(REMOTE_IP[4]) : null;
const REMOTE_IPv6 = REMOTE_IP && REMOTE_IP[6] ? new RegExp(REMOTE_IP[6]) : null;

const FORBIDDEN_RESPONSE = {
  statusCode: 403,
  statusDescription: 'Forbidden',
  headers: { 'content-type': { value: 'text/html' } },
  body: FORBIDDEN_HTML,
};
const UNAUTHORIZED_RESPONSE = {
  statusCode: 401,
  statusDescription: 'Unauthorized',
  headers: { 'content-type': { value: 'text/html' }, 'www-authenticate': { value: 'Basic' } },
  body: UNAUTHORIZED_HTML,
};

/**
 * @param {AWSCloudFrontFunction.Event} event
 * @returns {AWSCloudFrontFunction.Response|AWSCloudFrontFunction.Request}
 */
function handler(event) {
  const request = event.request;

  const ipValid = REMOTE_IP ? checkRemoteIp(event.viewer.ip) : true;
  const authValid = BASIC_AUTH ? checkBasicAuth(request) : true;
  if (SATISFY === 'ANY') {
    if (!ipValid && !authValid) return UNAUTHORIZED_RESPONSE;
  } else {
    if (!ipValid) return FORBIDDEN_RESPONSE;
    if (!authValid) return UNAUTHORIZED_RESPONSE;
  }

  return request;
}

/**
 * @param {AWSCloudFrontFunction.Request} request
 */
function checkBasicAuth(request) {
  const authorization = request.headers.authorization;
  if (authorization) {
    const auth = authorization.value.split(/\s+/);
    return auth.length === 2 && auth[0].toLowerCase() === 'basic' && matchAuth(auth[1]);
  }
}

/**
 * @param {string} actual
 */
function matchAuth(actual) {
  return BASIC_AUTH.some((expected) => expected === actual);
}

/**
 * @param {string} ip
 */
function checkRemoteIp(ip) {
  return ip.includes(':') ? REMOTE_IPv6 && REMOTE_IPv6.test(ip6bin(ip)) : REMOTE_IPv4 && REMOTE_IPv4.test(ip4bin(ip));
}

/**
 * @param {string} ip
 */
function ip4bin(ip) {
  return ip
    .split('.')
    .map((c) => (+c).toString(2).padStart(8, '0'))
    .join('');
}

/**
 * @param {string} ip
 */
function ip6bin(ip) {
  return ip
    .replace(/^::/, '0::')
    .replace(/::$/, '::0')
    .split(':')
    .map((c) => c && parseInt(c, 16).toString(2).padStart(16, '0'))
    .map((c, i, array) => c || '0'.repeat(128 - array.join('').length))
    .join('');
}
