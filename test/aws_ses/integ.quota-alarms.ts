import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as ais from '../../dist';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'QuotaAlarmsIntegTest');
cdk.Validations.of(app).acknowledge({ id: 'CloudFormation-Validate::F0001', reason: 'no assertions' });

const topic = new sns.Topic(stack, 'Topic');
const func = new lambda.Function(stack, 'Func', {
  code: lambda.Code.fromInline('export const handler = async () => 0'),
  runtime: lambda.Runtime.NODEJS_24_X,
  handler: 'index.handler',
});
const alarms = new ais.ses.QuotaAlarms(stack, 'QuotaAlarms');
alarms.addAlarmAction(new actions.LambdaAction(func), new actions.SnsAction(topic));
alarms.addOkAction(new actions.LambdaAction(func));
alarms.addAlarmMuteRule('MuteRule', {
  schedule: cloudwatch.ScheduleExpression.cron({ hour: '0', minute: '0' }),
  duration: cdk.Duration.hours(1),
});

new IntegTest(app, 'integ-test', {
  testCases: [stack],
});
