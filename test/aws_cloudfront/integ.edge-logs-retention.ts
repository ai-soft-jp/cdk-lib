import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import * as ais from '../../lib';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'EdgeLogsRetentionIntegTest');

new ais.cloudfront.EdgeLogsRetention(stack, 'EdgeLogsRetention');

new IntegTest(app, 'integ-test', {
  testCases: [stack],
});
