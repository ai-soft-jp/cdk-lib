import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as ais from '../../lib';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'AccessControlIntegTest');

const func = new ais.cloudfront.AccessControl(stack, 'Function', {
  basicAuth: ['user:pass'],
  remoteIp: ['10.0.0.0/16', '2001:db8::/32'],
  satisfy: ais.cloudfront.Satisfy.ANY,
});

new cloudfront.Distribution(stack, 'Distribution', {
  defaultBehavior: {
    origin: new origins.HttpOrigin('integ.aws'),
    functionAssociations: [{ eventType: cloudfront.FunctionEventType.VIEWER_REQUEST, function: func }],
  },
});

new IntegTest(app, 'integ-test', {
  testCases: [stack],
});
