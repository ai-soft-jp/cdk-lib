import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as ais from '../../lib';

describe('AccessControl', () => {
  let stack: cdk.Stack;
  beforeEach(() => {
    stack = new cdk.Stack();
  });

  describe('bundling', () => {
    test('basic auth', () => {
      new ais.cloudfront.AccessControl(stack, 'AccessControl', {
        basicAuth: ['user:pass', 'another:p@ss'],
      });
      Template.fromStack(stack).hasResourceProperties('AWS::CloudFront::Function', {
        FunctionCode: Match.stringLikeRegexp('"dXNlcjpwYXNz",\\s*"YW5vdGhlcjpwQHNz"'),
      });
    });

    test('ipv4', () => {
      new ais.cloudfront.AccessControl(stack, 'AccessControl', {
        remoteIp: ['10.0.0.0/16', '192.0.2.1'],
      });
      Template.fromStack(stack).hasResourceProperties('AWS::CloudFront::Function', {
        FunctionCode: Match.stringLikeRegexp('\\?:0000101000000000\\|11000{16}001000000001'),
      });
    });

    test('ipv6', () => {
      new ais.cloudfront.AccessControl(stack, 'AccessControl', {
        remoteIp: ['2001:db8::/56', '::1'],
      });
      Template.fromStack(stack).hasResourceProperties('AWS::CloudFront::Function', {
        FunctionCode: Match.stringLikeRegexp('\\?:00100{8}000100001101101110000{24}\\|0{127}1'),
      });
    });

    test('forbidden html', () => {
      new ais.cloudfront.AccessControl(stack, 'AccessControl', {
        remoteIp: ['2001:db8::/56', '::1'],
        forbiddenHtml: '<html><body>Forbidden</body></html>',
      });
      Template.fromStack(stack).hasResourceProperties('AWS::CloudFront::Function', {
        FunctionCode: Match.stringLikeRegexp('"<html><body>Forbidden</body></html>"'),
      });
    });

    test('forbidden html', () => {
      new ais.cloudfront.AccessControl(stack, 'AccessControl', {
        remoteIp: ['2001:db8::/56', '::1'],
        unauthorizedHtml: '<html><body>Unauthorized</body></html>',
      });
      Template.fromStack(stack).hasResourceProperties('AWS::CloudFront::Function', {
        FunctionCode: Match.stringLikeRegexp('"<html><body>Unauthorized</body></html>"'),
      });
    });
  });

  describe('execution', () => {
    type CloudFrontFunction = (
      event: AWSCloudFrontFunction.Event,
    ) => AWSCloudFrontFunction.Request | AWSCloudFrontFunction.Response;

    function getHandler(logicalId: string): CloudFrontFunction {
      const res = Template.fromStack(stack).findResources('AWS::CloudFront::Function');
      const code = res[logicalId]!.Properties.FunctionCode;
      return new Function(`'use strict'\n${code}\nreturn handler;`)();
    }

    function event(ip: string, auth?: string): AWSCloudFrontFunction.Event {
      return {
        version: '1.0',
        context: {
          distributionDomainName: 'd123.cloudfront.net',
          distributionId: 'E1234567890',
          eventType: 'viewer-request',
          requestId: '12345678',
        },
        viewer: { ip },
        request: {
          method: 'GET',
          uri: '/index.html',
          querystring: {},
          headers: auth ? { authorization: { value: `Basic ${Buffer.from(auth).toString('base64')}` } } : {},
          cookies: {},
          rawQueryString: () => undefined,
        },
        response: {
          statusCode: 200,
        },
      };
    }

    describe('basic auth', () => {
      test('returns 401 for no credentials', () => {
        new ais.cloudfront.AccessControl(stack, 'AccessControl', { basicAuth: ['user:pass'] });
        const handler = getHandler('AccessControlF74EEFB5');
        expect(handler(event('127.0.0.1'))).toMatchObject({ statusCode: 401 });
      });

      test('returns 401 for incorrect credential', () => {
        new ais.cloudfront.AccessControl(stack, 'AccessControl', { basicAuth: ['user:pass'] });
        const handler = getHandler('AccessControlF74EEFB5');
        expect(handler(event('127.0.0.1', 'bad:pass'))).toMatchObject({ statusCode: 401 });
      });

      test('passthrough request for correct credential', () => {
        new ais.cloudfront.AccessControl(stack, 'AccessControl', { basicAuth: ['user:pass', 'another:p@ass'] });
        const handler = getHandler('AccessControlF74EEFB5');
        expect(handler(event('127.0.0.1', 'user:pass'))).toMatchObject({ method: 'GET' });
        expect(handler(event('127.0.0.1', 'another:p@ass'))).toMatchObject({ method: 'GET' });
      });
    });

    describe('remote ip', () => {
      test('returns 403 for blocked ip', () => {
        new ais.cloudfront.AccessControl(stack, 'AccessControl', { remoteIp: ['192.0.2.0/24', '2001:db8:1::/56'] });
        const handler = getHandler('AccessControlF74EEFB5');
        expect(handler(event('127.0.0.1'))).toMatchObject({ statusCode: 403 });
        expect(handler(event('2001:db8:2::33:4'))).toMatchObject({ statusCode: 403 });
      });

      test('passthrough request for allowed ip', () => {
        new ais.cloudfront.AccessControl(stack, 'AccessControl', { remoteIp: ['192.0.2.0/24', '2001:db8:1::/56'] });
        const handler = getHandler('AccessControlF74EEFB5');
        expect(handler(event('192.0.2.54'))).toMatchObject({ method: 'GET' });
        expect(handler(event('2001:db8:1::44:5'))).toMatchObject({ method: 'GET' });
      });
    });

    describe('satisfy all', () => {
      test('returns 403 for blocked ip with correct credential', () => {
        new ais.cloudfront.AccessControl(stack, 'AccessControl', {
          basicAuth: ['user:pass', 'another:p@ss'],
          remoteIp: ['192.0.2.0/24', '2001:db8:1::/56'],
          satisfy: ais.cloudfront.Satisfy.ALL,
        });
        const handler = getHandler('AccessControlF74EEFB5');
        expect(handler(event('127.0.0.1', 'user:pass'))).toMatchObject({ statusCode: 403 });
        expect(handler(event('2001:db8:2::33:4', 'another:p@ss'))).toMatchObject({ statusCode: 403 });
      });

      test('returns 401 for allowed ip with incorrect credential', () => {
        new ais.cloudfront.AccessControl(stack, 'AccessControl', {
          basicAuth: ['user:pass', 'another:p@ss'],
          remoteIp: ['192.0.2.0/24', '2001:db8:1::/56'],
          satisfy: ais.cloudfront.Satisfy.ALL,
        });
        const handler = getHandler('AccessControlF74EEFB5');
        expect(handler(event('192.0.2.27'))).toMatchObject({ statusCode: 401 });
        expect(handler(event('192.0.2.27', 'bad:pass'))).toMatchObject({ statusCode: 401 });
        expect(handler(event('2001:db8:1::563'))).toMatchObject({ statusCode: 401 });
        expect(handler(event('2001:db8:1::563', 'aqa:pkr'))).toMatchObject({ statusCode: 401 });
      });

      test('passthrough request for allowed ip with correct credential', () => {
        new ais.cloudfront.AccessControl(stack, 'AccessControl', {
          basicAuth: ['user:pass', 'another:p@ss'],
          remoteIp: ['192.0.2.0/24', '2001:db8:1::/56'],
          satisfy: ais.cloudfront.Satisfy.ALL,
        });
        const handler = getHandler('AccessControlF74EEFB5');
        expect(handler(event('192.0.2.54', 'user:pass'))).toMatchObject({ method: 'GET' });
        expect(handler(event('2001:db8:1::fb9', 'another:p@ss'))).toMatchObject({ method: 'GET' });
      });
    });

    describe('satisfy any', () => {
      test('returns 401 for blocked ip', () => {
        new ais.cloudfront.AccessControl(stack, 'AccessControl', {
          basicAuth: ['user:pass', 'another:p@ss'],
          remoteIp: ['192.0.2.0/24', '2001:db8:1::/56'],
          satisfy: ais.cloudfront.Satisfy.ANY,
        });
        const handler = getHandler('AccessControlF74EEFB5');
        expect(handler(event('127.0.0.1'))).toMatchObject({ statusCode: 401 });
        expect(handler(event('2001:db8:2::33:4'))).toMatchObject({ statusCode: 401 });
      });

      test('returns 401 for blocked ip with incorrect credential', () => {
        new ais.cloudfront.AccessControl(stack, 'AccessControl', {
          basicAuth: ['user:pass', 'another:p@ss'],
          remoteIp: ['192.0.2.0/24', '2001:db8:1::/56'],
          satisfy: ais.cloudfront.Satisfy.ANY,
        });
        const handler = getHandler('AccessControlF74EEFB5');
        expect(handler(event('127.0.0.1', 'bad:pass'))).toMatchObject({ statusCode: 401 });
        expect(handler(event('2001:db8:2::33:4', 'mea:aqua'))).toMatchObject({ statusCode: 401 });
      });

      test('passthrough request for allowed ip without credentials', () => {
        new ais.cloudfront.AccessControl(stack, 'AccessControl', {
          basicAuth: ['user:pass', 'another:p@ss'],
          remoteIp: ['192.0.2.0/24', '2001:db8:1::/56'],
          satisfy: ais.cloudfront.Satisfy.ANY,
        });
        const handler = getHandler('AccessControlF74EEFB5');
        expect(handler(event('192.0.2.27'))).toMatchObject({ method: 'GET' });
        expect(handler(event('2001:db8:1::563'))).toMatchObject({ method: 'GET' });
      });

      test('passthrough request for blocked ip but with correct credential', () => {
        new ais.cloudfront.AccessControl(stack, 'AccessControl', {
          basicAuth: ['user:pass', 'another:p@ss'],
          remoteIp: ['192.0.2.0/24', '2001:db8:1::/56'],
          satisfy: ais.cloudfront.Satisfy.ANY,
        });
        const handler = getHandler('AccessControlF74EEFB5');
        expect(handler(event('127.0.0.1', 'user:pass'))).toMatchObject({ method: 'GET' });
        expect(handler(event('2001:db8:2::33:4', 'another:p@ss'))).toMatchObject({ method: 'GET' });
      });
    });

    test('custom 403 html', () => {
      new ais.cloudfront.AccessControl(stack, 'AccessControl', {
        remoteIp: ['192.0.2.0/24'],
        forbiddenHtml: '<html><body>Forbidden</body></html>',
      });
      const handler = getHandler('AccessControlF74EEFB5');
      expect(handler(event('127.0.0.1'))).toMatchObject({ body: '<html><body>Forbidden</body></html>' });
    });

    test('custom 401 html', () => {
      new ais.cloudfront.AccessControl(stack, 'AccessControl', {
        basicAuth: ['user:pass'],
        unauthorizedHtml: '<html><body>Unauthorized</body></html>',
      });
      const handler = getHandler('AccessControlF74EEFB5');
      expect(handler(event('127.0.0.1', 'bad:pass'))).toMatchObject({ body: '<html><body>Unauthorized</body></html>' });
    });
  });
});
