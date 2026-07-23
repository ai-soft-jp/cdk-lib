import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as ais from '../../lib';
import { event, getHandler } from './helpers/function-event';

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
    test.each(['/', '/dead/beef', '/blah?soy=sauce'])('no keep path for %s', (path) => {
      new ais.cloudfront.SimpleRedirect(stack, 'SimpleRedirect', {
        target: 'https://redirect.test/',
      });
      const handler = getHandler(stack, /^SimpleRedirect/);
      expect(handler(event({ path }))).toMatchObject({
        statusCode: 301,
        headers: { location: { value: 'https://redirect.test/' } },
      });
    });

    test.each(['/', '/dead/beef', '/blah?soy=sauce'])('keep path for %s', (path) => {
      new ais.cloudfront.SimpleRedirect(stack, 'SimpleRedirect', {
        target: 'https://redirect.test/',
        keepPath: true,
      });
      const handler = getHandler(stack, /^SimpleRedirect/);
      expect(handler(event({ path }))).toMatchObject({
        statusCode: 301,
        headers: { location: { value: `https://redirect.test${path}` } },
      });
    });

    test('status code 302', () => {
      new ais.cloudfront.SimpleRedirect(stack, 'SimpleRedirect', {
        target: 'https://redirect.test/',
        statusCode: 302,
      });
      const handler = getHandler(stack, /^SimpleRedirect/);
      expect(handler(event({}))).toMatchObject({ statusCode: 302 });
    });
  });
});
