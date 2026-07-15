import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as ais from '../../dist';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'QuotaAlarmsIntegTest');

const topic = new sns.Topic(stack, 'Topic');
const alarms = new ais.ses.QuotaAlarms(stack, 'QuotaAlarms', { version: 'IntegTest' });
alarms.addAlarmAction(new actions.SnsAction(topic));

new IntegTest(app, 'integ-test', {
  testCases: [stack],
});
