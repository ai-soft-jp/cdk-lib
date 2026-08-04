import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
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

  test('functionAssociation', () => {
    const func = new ais.cloudfront.SimpleRedirect(stack, 'SimpleRedirect', {
      target: 'https://redirect.test/',
    });
    expect(func.functionAssociation()).toEqual({
      eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
      function: func,
    });
  });

  describe('no keep path', () => {
    test.each(['/', '/dead/beef', '/blah?soy=sauce'])('for %s', (path) => {
      const func = new ais.cloudfront.SimpleRedirect(stack, 'SimpleRedirect', {
        target: 'https://redirect.test/',
      });
      const handler = getHandler(stack, func);
      expect(handler(event({ path }))).toMatchObject({
        statusCode: 301,
        headers: { location: { value: 'https://redirect.test/' } },
      });
    });
  });

  describe('keep path', () => {
    test.each(['/', '/dead/beef', '/blah?soy=sauce'])('for %s', (path) => {
      const func = new ais.cloudfront.SimpleRedirect(stack, 'SimpleRedirect', {
        target: 'https://redirect.test/',
        keepPath: true,
      });
      const handler = getHandler(stack, func);
      expect(handler(event({ path }))).toMatchObject({
        statusCode: 301,
        headers: { location: { value: `https://redirect.test${path}` } },
      });
    });
  });

  test('status code 302', () => {
    const func = new ais.cloudfront.SimpleRedirect(stack, 'SimpleRedirect', {
      target: 'https://redirect.test/',
      statusCode: 302,
    });
    const handler = getHandler(stack, func);
    expect(handler(event({}))).toMatchObject({ statusCode: 302 });
  });
});
