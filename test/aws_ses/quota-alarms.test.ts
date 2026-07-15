import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as ais from '../../lib';

describe('QuotaAlarms', () => {
  let stack: cdk.Stack;
  beforeEach(() => {
    stack = new cdk.Stack();
  });

  test('defines 4 alarms', () => {
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
    Template.fromStack(stack).hasResourceProperties('AWS::CloudWatch::Alarm', {
      Namespace: 'AWS/SES',
      MetricName: 'Send',
      Period: 86400,
      Threshold: { 'Fn::GetAtt': ['QuotaAlarmsGetQuotaA0505BE9', 'Max24HourSendThreshold'] },
    });
    Template.fromStack(stack).hasResourceProperties('AWS::CloudWatch::Alarm', {
      Namespace: 'AWS/SES',
      MetricName: 'Send',
      Period: 300,
      Threshold: { 'Fn::GetAtt': ['QuotaAlarmsGetQuotaA0505BE9', 'MaxSendRateThreshold'] },
    });
  });
});
