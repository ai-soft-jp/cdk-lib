import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as ais from '../../lib';
import { event, getHandlerAsync } from './helpers/function-event';

describe('MappedRedirect', () => {
  let stack: cdk.Stack;
  beforeEach(() => {
    stack = new cdk.Stack();
  });

  describe('bundles', () => {
    test('prefixTargets', () => {
      new ais.cloudfront.MappedRedirect(stack, 'MappedRedirect', {
        fallback: 'https://redirect.test/',
        prefixTargets: { '/dead/': '/beef/' },
        statusCode: 302,
      });
      Template.fromStack(stack).hasResourceProperties('AWS::CloudFront::Function', {
        FunctionCode: Match.stringLikeRegexp(RegExp.escape('["/dead/", "/beef/"]')),
      });
    });

    test('indices', () => {
      new ais.cloudfront.MappedRedirect(stack, 'MappedRedirect', {
        fallback: 'https://redirect.test/',
        index: ['index.html', 'index.php'],
        statusCode: 302,
      });
      Template.fromStack(stack).hasResourceProperties('AWS::CloudFront::Function', {
        FunctionCode: Match.stringLikeRegexp(RegExp.escape('["/index.html", "/index.php"]')),
      });
    });
  });

  describe('mapped target', () => {
    test('absolute URI', async () => {
      const func = new ais.cloudfront.MappedRedirect(stack, 'MappedRedirect', {
        fallback: 'https://redirect.test/',
        prefixTargets: { '/dead/': 'https://prefix.redirect.test/' },
        baseUrl: 'https://base.redirect.test',
      });
      const handler = await getHandlerAsync(stack, func, {
        '/dead/beef': 'https://mapped.redirect.test/soy/sauce',
      });
      expect(await handler(event({ path: '/dead/beef' }))).toMatchObject({
        statusCode: 301,
        headers: { location: { value: 'https://mapped.redirect.test/soy/sauce' } },
      });
    });

    test('absolute URI with index', async () => {
      const func = new ais.cloudfront.MappedRedirect(stack, 'MappedRedirect', {
        fallback: 'https://redirect.test/',
        index: ['index.html', 'index.php'],
      });
      const handler = await getHandlerAsync(stack, func, {
        '/dead/beef/': 'https://mapped.redirect.test/soy/sauce',
      });
      expect(await handler(event({ path: '/dead/beef/index.html' }))).toMatchObject({
        statusCode: 301,
        headers: { location: { value: 'https://mapped.redirect.test/soy/sauce' } },
      });
      expect(await handler(event({ path: '/dead/beef/index.php' }))).toMatchObject({
        statusCode: 301,
        headers: { location: { value: 'https://mapped.redirect.test/soy/sauce' } },
      });
      expect(await handler(event({ path: '/dead/beef/index.cgi' }))).toMatchObject({
        statusCode: 301,
        headers: { location: { value: 'https://redirect.test/' } },
      });
    });

    test('relative URI with fallback', async () => {
      const func = new ais.cloudfront.MappedRedirect(stack, 'MappedRedirect', {
        fallback: 'https://redirect.test/',
      });
      const handler = await getHandlerAsync(stack, func, {
        '/dead/beef': '/soy/sauce',
      });
      expect(await handler(event({ path: '/dead/beef' }))).toMatchObject({
        statusCode: 301,
        headers: { location: { value: 'https://redirect.test/soy/sauce' } },
      });
    });

    test('relative URI with base', async () => {
      const func = new ais.cloudfront.MappedRedirect(stack, 'MappedRedirect', {
        fallback: 'https://redirect.test/',
        baseUrl: 'https://base.redirect.test',
      });
      const handler = await getHandlerAsync(stack, func, {
        '/dead/beef': '/soy/sauce',
      });
      expect(await handler(event({ path: '/dead/beef' }))).toMatchObject({
        statusCode: 301,
        headers: { location: { value: 'https://base.redirect.test/soy/sauce' } },
      });
    });
  });

  describe('prefix target', () => {
    test('absolute URI', async () => {
      const func = new ais.cloudfront.MappedRedirect(stack, 'MappedRedirect', {
        fallback: 'https://redirect.test/',
        prefixTargets: { '/dead/': 'https://prefix.redirect.test/beef' },
        baseUrl: 'https://base.redirect.test',
      });
      const handler = await getHandlerAsync(stack, func, {});
      expect(await handler(event({ path: '/dead/beef' }))).toMatchObject({
        statusCode: 301,
        headers: { location: { value: 'https://prefix.redirect.test/beef' } },
      });
    });

    test('relative URI with base', async () => {
      const func = new ais.cloudfront.MappedRedirect(stack, 'MappedRedirect', {
        fallback: 'https://redirect.test/',
        prefixTargets: { '/dead/': '/soy/sauce' },
        baseUrl: 'https://base.redirect.test',
      });
      const handler = await getHandlerAsync(stack, func, {});
      expect(await handler(event({ path: '/dead/beef' }))).toMatchObject({
        statusCode: 301,
        headers: { location: { value: 'https://base.redirect.test/soy/sauce' } },
      });
    });

    test('relative URI with fallback', async () => {
      const func = new ais.cloudfront.MappedRedirect(stack, 'MappedRedirect', {
        fallback: 'https://redirect.test/',
        prefixTargets: { '/dead/': '/soy/sauce' },
      });
      const handler = await getHandlerAsync(stack, func, {});
      expect(await handler(event({ path: '/dead/beef' }))).toMatchObject({
        statusCode: 301,
        headers: { location: { value: 'https://redirect.test/soy/sauce' } },
      });
    });
  });

  describe('fallback target', () => {
    test('absolute URI', async () => {
      const func = new ais.cloudfront.MappedRedirect(stack, 'MappedRedirect', {
        fallback: 'https://redirect.test/',
        prefixTargets: { '/prefixed/': 'https://prefix.redirect.test/' },
      });
      const handler = await getHandlerAsync(stack, func, {});
      expect(await handler(event({ path: '/dead/beef' }))).toMatchObject({
        statusCode: 301,
        headers: { location: { value: 'https://redirect.test/' } },
      });
    });

    test('relative URI with base', async () => {
      const func = new ais.cloudfront.MappedRedirect(stack, 'MappedRedirect', {
        fallback: '/fallback',
        prefixTargets: { '/prefixed/': 'https://prefix.redirect.test/' },
        baseUrl: 'https://base.redirect.test',
      });
      const handler = await getHandlerAsync(stack, func, {});
      expect(await handler(event({ path: '/dead/beef' }))).toMatchObject({
        statusCode: 301,
        headers: { location: { value: 'https://base.redirect.test/fallback' } },
      });
    });
  });

  test('status code 302', async () => {
    const func = new ais.cloudfront.MappedRedirect(stack, 'MappedRedirect', {
      fallback: 'https://redirect.test/',
      statusCode: 302,
    });
    const handler = await getHandlerAsync(stack, func, {});
    expect(await handler(event({}))).toMatchObject({
      statusCode: 302,
    });
  });
});
