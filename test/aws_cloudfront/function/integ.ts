import cf from 'cloudfront';
const crypto = require('crypto');
const querystring = require('querystring');

declare const RESPONSE: string;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handler(event: AWSCloudFrontFunction.Event): Promise<AWSCloudFrontFunction.Response> {
  const kvs = cf.kvs();
  return {
    statusCode: 200,
    headers: { 'content-type': { value: 'text/plain' } },
    body: [
      RESPONSE,
      crypto.createHash('sha1').update('data').digest('hex').slice(0, 6),
      querystring.stringify({ name: 'value' }),
      (await kvs.get('value')) ?? 'NOT_FOUND',
    ].join(':'),
  };
}
