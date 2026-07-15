import { ExpectedResult, IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as ais from '../../lib';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'AccessControlIntegTest');

const bucket = new s3.Bucket(stack, 'Bucket', {
  autoDeleteObjects: true,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});
new deployment.BucketDeployment(stack, 'Deployment', {
  destinationBucket: bucket,
  sources: [deployment.Source.data('index.html', '<html><body>Hello, World!</body></html>')],
});

const func = new ais.cloudfront.AccessControl(stack, 'Function', {
  basicAuth: ['user:pass'],
  remoteIp: ['10.0.0.0/16', '2001:db8::/32'],
  satisfy: ais.cloudfront.Satisfy.ANY,
});

const distribution = new cloudfront.Distribution(stack, 'Distribution', {
  defaultBehavior: {
    origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
    functionAssociations: [{ eventType: cloudfront.FunctionEventType.VIEWER_REQUEST, function: func }],
  },
  defaultRootObject: 'index.html',
});

const integ = new IntegTest(app, 'integ-test', {
  testCases: [stack],
});
integ.assertions
  .httpApiCall(`https://${distribution.distributionDomainName}/`, {
    headers: { authorization: `Basic ${Buffer.from('user:pass').toString('base64')}` },
  })
  .expect(ExpectedResult.objectLike({ status: 200 }));
integ.assertions
  .httpApiCall(`https://${distribution.distributionDomainName}/`, {
    headers: { authorization: `Basic ${Buffer.from('bad:pass').toString('base64')}` },
  })
  .expect(ExpectedResult.objectLike({ status: 401 }));
