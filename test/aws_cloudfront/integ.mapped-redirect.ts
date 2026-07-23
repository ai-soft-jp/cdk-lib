import * as path from 'node:path';
import { ExpectedResult, IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ais from '../../lib';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'MappedRedirectIntegTest');

const func = new ais.cloudfront.MappedRedirect(stack, 'Redirect', {
  fallback: 'https://fallback.redirect/',
  prefixTargets: { '/prefix/': 'https://prefix.redirect/' },
  source: cloudfront.ImportSource.fromInline(
    JSON.stringify({ data: [{ key: '/mapped/', value: 'https://mapped.redirect/' }] }),
  ),
});
const func302 = new ais.cloudfront.MappedRedirect(stack, 'Redirect302', {
  fallback: 'https://redirect.test/',
  statusCode: 302,
});

const fetcher = new lambda.Function(stack, 'Fetcher', {
  code: lambda.Code.fromAsset(path.resolve(__dirname, 'function/redirect-fetch')),
  handler: 'index.handler',
  runtime: lambda.Runtime.NODEJS_24_X,
  architecture: lambda.Architecture.ARM_64,
  timeout: cdk.Duration.seconds(10),
});

const origin = new origins.HttpOrigin('redirect.aws');
const distribution = new cloudfront.Distribution(stack, 'Distribution', {
  defaultBehavior: {
    origin,
    functionAssociations: [{ eventType: cloudfront.FunctionEventType.VIEWER_REQUEST, function: func }],
  },
  additionalBehaviors: {
    '/redirect-302/*': {
      origin,
      functionAssociations: [{ eventType: cloudfront.FunctionEventType.VIEWER_REQUEST, function: func302 }],
    },
  },
  defaultRootObject: 'index.html',
});

const integ = new IntegTest(app, 'integ-test', {
  testCases: [stack],
});
integ.assertions
  .invokeFunction({
    functionName: fetcher.functionName,
    payload: JSON.stringify({ url: `https://${distribution.distributionDomainName}/fallback` }),
  })
  .expect(
    ExpectedResult.objectLike({ Payload: JSON.stringify({ status: 301, location: 'https://fallback.redirect/' }) }),
  );
integ.assertions
  .invokeFunction({
    functionName: fetcher.functionName,
    payload: JSON.stringify({ url: `https://${distribution.distributionDomainName}/mapped/` }),
  })
  .expect(
    ExpectedResult.objectLike({ Payload: JSON.stringify({ status: 301, location: 'https://mapped.redirect/' }) }),
  );
integ.assertions
  .invokeFunction({
    functionName: fetcher.functionName,
    payload: JSON.stringify({ url: `https://${distribution.distributionDomainName}/redirect-302/` }),
  })
  .expect(ExpectedResult.objectLike({ Payload: JSON.stringify({ status: 302, location: 'https://redirect.test/' }) }));
