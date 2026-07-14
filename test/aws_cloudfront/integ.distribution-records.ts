import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as ais from '../../lib';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'DistributionRecordsIntegTest');

const zone = new route53.HostedZone(stack, 'HostedZone', { zoneName: 'integ.aisrvs.dev' });

const distribution = new cloudfront.Distribution(stack, 'Distribution', {
  defaultBehavior: {
    origin: new origins.HttpOrigin('integ.aws'),
  },
});

new ais.cloudfront.DistributionRecords(stack, 'Records', { zone, recordName: 'www', distribution });

new IntegTest(app, 'integ-test', {
  testCases: [stack],
});
