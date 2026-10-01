/* CloudFront Access Control */

/* global PATHS FORBIDDEN_HTML UNAUTHORIZED_HTML */
const PATHS_RE = PATHS.map((path) => [new RegExp(path[0]), path[1]]);

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

  for (let i = 0; i < PATHS_RE.length; ++i) {
    if (PATHS_RE[i][0].test(request.uri)) {
      return check(event, PATHS_RE[i][1]) ?? request;
    }
  }

  return request;
}

/**
 * @param {AWSCloudFrontFunction.Event} event
 * @param {{basicAuth:string[],remoteIp:{4?:string,6?:string},satisfy:string}} options
 */
function check(event, options) {
  if (!options) return;
  const ipValid = options.remoteIp ? checkRemoteIp(event.viewer.ip, canonicalizeRemoteIp(options.remoteIp)) : true;
  const authValid = options.basicAuth ? checkBasicAuth(event.request, options.basicAuth) : true;
  if (options.satisfy === 'ANY') {
    if (!ipValid && !authValid) return UNAUTHORIZED_RESPONSE;
  } else {
    if (!ipValid) return FORBIDDEN_RESPONSE;
    if (!authValid) return UNAUTHORIZED_RESPONSE;
  }
}

/**
 * @param {AWSCloudFrontFunction.Request} request
 * @param {string[]} basicAuth
 */
function checkBasicAuth(request, basicAuth) {
  const authorization = request.headers.authorization;
  if (authorization) {
    const auth = authorization.value.split(/\s+/);
    return auth.length === 2 && auth[0].toLowerCase() === 'basic' && matchAuth(auth[1], basicAuth);
  }
}

/**
 * @param {string} actual
 * @param {string[]} basicAuth
 */
function matchAuth(actual, basicAuth) {
  return basicAuth.some((expected) => expected === actual);
}

/**
 * @param {{4?:string,6?:string}} remoteIp
 * @returns {{4?:RegExp,6?:RegExp}}
 */
function canonicalizeRemoteIp(remoteIp) {
  if (remoteIp[4] && typeof remoteIp[4] === 'string') remoteIp[4] = new RegExp(remoteIp[4]);
  if (remoteIp[6] && typeof remoteIp[6] === 'string') remoteIp[6] = new RegExp(remoteIp[6]);
  return remoteIp;
}

/**
 * @param {string} ip
 * @param {{4?:RegExp,6?:RegExp}} remoteIp
 */
function checkRemoteIp(ip, remoteIp) {
  return ip.includes(':') ? remoteIp[6]?.test(ip6bin(ip)) : remoteIp[4]?.test(ip4bin(ip));
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
