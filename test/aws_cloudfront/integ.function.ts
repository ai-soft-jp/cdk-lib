import * as path from 'node:path';
import { ExpectedResult, IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as ais from '../../lib';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'CloudFrontFunctionIntegTest');

const keyValueStore = new cloudfront.KeyValueStore(stack, 'KVS', {
  source: cloudfront.ImportSource.fromInline(JSON.stringify({ data: [{ key: 'value', value: 'KVS_VALUE' }] })),
});

const func = new ais.cloudfront.Function(stack, 'Function', {
  entry: path.join(__dirname, 'function/integ.ts'),
  define: { RESPONSE: 'IntegResponse' },
  keyValueStore,
});

const distribution = new cloudfront.Distribution(stack, 'Distribution', {
  defaultBehavior: {
    origin: new origins.HttpOrigin('integ.aws'),
    functionAssociations: [{ eventType: cloudfront.FunctionEventType.VIEWER_REQUEST, function: func }],
  },
});

const integ = new IntegTest(app, 'integ-test', {
  testCases: [stack],
});
integ.assertions
  .httpApiCall(`https://${distribution.distributionDomainName}/`)
  .expect(ExpectedResult.objectLike({ status: 200, body: 'IntegResponse:a17c9a:name=value:KVS_VALUE' }));
