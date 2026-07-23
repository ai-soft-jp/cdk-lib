import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as ais from '../../lib';

describe('SimpleRedirect', () => {
  let stack: cdk.Stack;
  beforeEach(() => {
    stack = new cdk.Stack();
  });

  test('bundles', () => {
    new ais.cloudfront.SimpleRedirect(stack, 'SimpleRedirect', {
      target: 'https://redirect.test',
      keepPath: true,
      statusCode: 302,
    });
    Template.fromStack(stack).hasResourceProperties('AWS::CloudFront::Function', {
      FunctionCode: Match.stringLikeRegexp('https://redirect.test'),
    });
  });

  describe('execution', () => {
    type CloudFrontFunction = (
      event: AWSCloudFrontFunction.Event,
    ) => AWSCloudFrontFunction.Request | AWSCloudFrontFunction.Response;

    function getHandler(logicalId: RegExp): CloudFrontFunction {
      const res = Template.fromStack(stack).findResources('AWS::CloudFront::Function');
      const code = Object.entries(res).find(([id]) => logicalId.test(id))![1].Properties.FunctionCode;
      return new Function(`'use strict'\n${code}\nreturn handler;`)();
    }

    function event(path: string): AWSCloudFrontFunction.Event {
      const url = new URL(path, 'http://localhost');
      return {
        version: '1.0',
        context: {
          distributionDomainName: 'd123.cloudfront.net',
          distributionId: 'E1234567890',
          eventType: 'viewer-request',
          requestId: '12345678',
        },
        viewer: { ip: '127.0.0.1' },
        request: {
          method: 'GET',
          uri: url.pathname,
          querystring: Object.fromEntries(url.searchParams.entries().map(([name, value]) => [name, { value }])),
          headers: {},
          cookies: {},
          rawQueryString: () => (url.search ? url.search.slice(1) : undefined),
        },
        response: {
          statusCode: 200,
        },
      };
    }

    test.each(['/', '/dead/beef', '/blah?soy=sauce'])('no keep path for %s', (path) => {
      new ais.cloudfront.SimpleRedirect(stack, 'SimpleRedirect', {
        target: 'https://redirect.test/',
      });
      const handler = getHandler(/^SimpleRedirect/);
      expect(handler(event(path))).toMatchObject({
        statusCode: 301,
        headers: { location: { value: 'https://redirect.test/' } },
      });
    });

    test.each(['/', '/dead/beef', '/blah?soy=sauce'])('keep path for %s', (path) => {
      new ais.cloudfront.SimpleRedirect(stack, 'SimpleRedirect', {
        target: 'https://redirect.test/',
        keepPath: true,
      });
      const handler = getHandler(/^SimpleRedirect/);
      expect(handler(event(path))).toMatchObject({
        statusCode: 301,
        headers: { location: { value: `https://redirect.test${path}` } },
      });
    });

    test('status code 302', () => {
      new ais.cloudfront.SimpleRedirect(stack, 'SimpleRedirect', {
        target: 'https://redirect.test/',
        statusCode: 302,
      });
      const handler = getHandler(/^SimpleRedirect/);
      expect(handler(event('/'))).toMatchObject({
        statusCode: 302,
      });
    });
  });
});
