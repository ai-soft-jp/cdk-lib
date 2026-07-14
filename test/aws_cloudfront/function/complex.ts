import cf from 'cloudfront';
const crypto = require('crypto');
const querystring = require('querystring');

async function handler(
  event: AWSCloudFrontFunction.Event,
): Promise<AWSCloudFrontFunction.Request | AWSCloudFrontFunction.Response> {
  const kvs = cf.kvs();
  const request = event.request;

  request.headers['x-crypto'] = { value: crypto.createHash('sha1').update('data').digest('hex') };
  request.headers['x-querystring'] = { value: querystring.stringify({ name: 'value', abc: ['xyz', '123'] }) };
  request.headers['x-kvs-value'] = { value: (await kvs.get('value')) ?? 'NOT_FOUND' };

  return request;
}
