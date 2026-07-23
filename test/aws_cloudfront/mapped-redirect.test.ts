import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as ais from '../../lib';
import { event, getHandlerAsync } from './helpers/function-event';

describe('MappedRedirect', () => {
  let stack: cdk.Stack;
  beforeEach(() => {
    stack = new cdk.Stack();
  });

  test('bundles', () => {
    new ais.cloudfront.MappedRedirect(stack, 'MappedRedirect', {
      fallback: 'https://redirect.test/',
      prefixTargets: { '/dead/': '/beef/' },
      statusCode: 302,
    });
    Template.fromStack(stack).hasResourceProperties('AWS::CloudFront::Function', {
      FunctionCode: Match.stringLikeRegexp('\\["/dead/", "/beef/"\\]'),
    });
  });

  describe('execution', () => {
    test('mapped target', async () => {
      new ais.cloudfront.MappedRedirect(stack, 'MappedRedirect', {
        fallback: 'https://redirect.test/',
        prefixTargets: { '/dead/': 'https://prefix.redirect.test/' },
      });
      const handler = await getHandlerAsync(stack, /^MappedRedirect/, {
        '/dead/beef': 'https://mapped.redirect.test/soy/sauce',
      });
      expect(await handler(event({ path: '/dead/beef' }))).toMatchObject({
        statusCode: 301,
        headers: { location: { value: 'https://mapped.redirect.test/soy/sauce' } },
      });
    });

    test('prefix target', async () => {
      new ais.cloudfront.MappedRedirect(stack, 'MappedRedirect', {
        fallback: 'https://redirect.test/',
        prefixTargets: { '/dead/': 'https://prefix.redirect.test/beef' },
      });
      const handler = await getHandlerAsync(stack, /^MappedRedirect/, {});
      expect(await handler(event({ path: '/dead/beef' }))).toMatchObject({
        statusCode: 301,
        headers: { location: { value: 'https://prefix.redirect.test/beef' } },
      });
    });

    test('fallback', async () => {
      new ais.cloudfront.MappedRedirect(stack, 'MappedRedirect', {
        fallback: 'https://redirect.test/',
      });
      const handler = await getHandlerAsync(stack, /^MappedRedirect/, {});
      expect(await handler(event({ path: '/dead/beef' }))).toMatchObject({
        statusCode: 301,
        headers: { location: { value: 'https://redirect.test/' } },
      });
    });

    test('status code 302', async () => {
      new ais.cloudfront.MappedRedirect(stack, 'MappedRedirect', {
        fallback: 'https://redirect.test/',
        statusCode: 302,
      });
      const handler = await getHandlerAsync(stack, /^MappedRedirect/, {});
      expect(await handler(event({}))).toMatchObject({
        statusCode: 302,
      });
    });
  });
});
