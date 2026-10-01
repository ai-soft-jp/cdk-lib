import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import * as ais from '../../lib';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'EdgeLogsRetentionIntegTest');
cdk.Validations.of(app).acknowledge({ id: 'CloudFormation-Validate::F0001', reason: 'no assertions' });

new ais.cloudfront.EdgeLogsRetention(stack, 'EdgeLogsRetention');

new IntegTest(app, 'integ-test', {
  testCases: [stack],
});
