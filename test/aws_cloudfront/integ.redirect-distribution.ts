import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as ais from '../../lib';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'RedirectDistributionIntegTest');

new ais.cloudfront.RedirectDistribution(stack, 'Simple', {
  redirection: ais.cloudfront.Redirection.simple({ target: 'https://simple.redirect/' }),
});
new ais.cloudfront.RedirectDistribution(stack, 'Mapped', {
  redirection: ais.cloudfront.Redirection.mapped({ fallback: 'https://mapped.redirect/' }),
  viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.ALLOW_ALL,
  responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
});
new ais.cloudfront.RedirectDistribution(stack, 'Custom', {
  redirection: ais.cloudfront.Redirection.custom(
    new cloudfront.Function(stack, 'CustomFunc', {
      code: cloudfront.FunctionCode.fromInline('function handler() {}'),
    }),
  ),
});

new IntegTest(app, 'integ-test', {
  testCases: [stack],
});
