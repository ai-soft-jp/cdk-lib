import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as ais from '../../dist';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'EventLogIntegTest');
cdk.Validations.of(app).acknowledge({ id: 'CloudFormation-Validate::F0001', reason: 'no assertions' });

const configurationSet = new ses.ConfigurationSet(stack, 'ConfigurationSet');
new ais.ses.EventLog(stack, 'EventLog', { configurationSet });

new IntegTest(app, 'integ-test', {
  testCases: [stack],
});
