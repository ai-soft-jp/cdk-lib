import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cxapi from 'aws-cdk-lib/cx-api';
import * as ais from '../../lib';

describe('QuotaAlarms', () => {
  let stack: cdk.Stack;
  beforeEach(() => {
    const app = new cdk.App({ context: { [cxapi.LAMBDA_PERMISSION_LOGICAL_ID_FOR_LAMBDA_ACTION]: true } });
    stack = new cdk.Stack(app);
  });

  test('defines 2 alarms initially', () => {
    new ais.ses.QuotaAlarms(stack, 'QuotaAlarms');
    Template.fromStack(stack).hasResourceProperties('AWS::CloudWatch::Alarm', {
      Namespace: 'AWS/SES',
      MetricName: 'Reputation.BounceRate',
      Threshold: 0.05,
    });
    Template.fromStack(stack).hasResourceProperties('AWS::CloudWatch::Alarm', {
      Namespace: 'AWS/SES',
      MetricName: 'Reputation.ComplaintRate',
      Threshold: 0.001,
    });
  });

  test('defines an event rule', () => {
    new ais.ses.QuotaAlarms(stack, 'QuotaAlarms');
    Template.fromStack(stack).hasResourceProperties('AWS::Events::Rule', {
      EventPattern: {
        source: ['aws.servicequotas'],
        'detail-type': ['AWS API Call via CloudTrail'],
        detail: {
          eventName: ['RequestServiceQuotaIncrease'],
          responseElements: {
            requestedQuota: {
              serviceCode: ['ses'],
              quotaName: ['Sending rate', 'Sending quota'],
            },
          },
        },
      },
      Targets: [
        {
          Arn: {
            'Fn::Join': [
              '',
              [{ 'Fn::GetAtt': ['QuotaAlarmsServiceQuotaRuleEventHandler8F3226AC', 'Arn'] }, ':$LATEST'],
            ],
          },
        },
      ],
    });
    Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Permission', {
      Action: 'lambda:InvokeFunction',
      FunctionName: { 'Fn::GetAtt': ['QuotaAlarmsServiceQuotaRuleEventHandler8F3226AC', 'Arn'] },
      Principal: 'events.amazonaws.com',
      SourceArn: { 'Fn::GetAtt': ['QuotaAlarmsServiceQuotaRuleDA171EA8', 'Arn'] },
    });
  });

  test('creates initial alarms', () => {
    new ais.ses.QuotaAlarms(stack, 'QuotaAlarms');
    Template.fromStack(stack).hasResourceProperties('AWS::CloudFormation::CustomResource', {
      ServiceToken: {
        'Fn::Join': ['', [{ 'Fn::GetAtt': ['QuotaAlarmsServiceQuotaRuleEventHandler8F3226AC', 'Arn'] }, ':$LATEST']],
      },
      ServiceTimeout: '10',
    });
  });

  test('builds handler environment', () => {
    const func = new lambda.Function(stack, 'Func', {
      code: lambda.Code.fromInline('export const handler = async () => {}'),
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: 'index.handler',
    });
    const topic = new sns.Topic(stack, 'Topic');
    const alarms = new ais.ses.QuotaAlarms(stack, 'QuotaAlarms');
    alarms.addAlarmAction(new actions.LambdaAction(func), new actions.SnsAction(topic));
    alarms.addOkAction(new actions.LambdaAction(func));
    Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          SEND_QUOTA_ALARM_NAME: 'QuotaAlarms-SendQuotaAlarm-C17BE4D6',
          SEND_RATE_ALARM_NAME: 'QuotaAlarms-SendRateAlarm-D56AFCF7',
          ALARM_ACTION_ARNS: {
            'Fn::Join': [',', [stack.resolve(func.functionArn), stack.resolve(topic.topicArn)]],
          },
          OK_ACTION_ARNS: stack.resolve(func.functionArn),
        },
      },
    });
  });

  test('addAlarmMuteRule', () => {
    const alarms = new ais.ses.QuotaAlarms(stack, 'QuotaAlarms');
    alarms.addAlarmMuteRule('MuteRule', {
      schedule: cloudwatch.ScheduleExpression.cron({ hour: '4', minute: '0' }),
      duration: cdk.Duration.hours(1),
    });
    Template.fromStack(stack).hasResourceProperties('AWS::CloudWatch::AlarmMuteRule', {
      MuteTargets: {
        AlarmNames: [
          { Ref: 'QuotaAlarmsHighBounceRateAlarm4F3C87A5' },
          { Ref: 'QuotaAlarmsHighComplaintRateAlarmE122D6B6' },
          'QuotaAlarms-SendQuotaAlarm-C17BE4D6',
          'QuotaAlarms-SendRateAlarm-D56AFCF7',
        ],
      },
      Rule: {
        Schedule: {
          Duration: 'PT1H',
          Expression: 'cron(0 4 * * *)',
        },
      },
    });
  });
});
