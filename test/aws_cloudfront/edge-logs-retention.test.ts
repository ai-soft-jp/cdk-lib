import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as ais from '../../lib';

describe('EdgeLogsRetention', () => {
  let stack: cdk.Stack;
  beforeEach(() => {
    stack = new cdk.Stack();
  });

  test('defines a schedule', () => {
    new ais.cloudfront.EdgeLogsRetention(stack, 'EdgeLogsRetention');
    Template.fromStack(stack).hasResourceProperties('AWS::Scheduler::Schedule', {
      ScheduleExpression: 'rate(7 days)',
      Target: {
        Arn: { 'Fn::GetAtt': ['EdgeLogsRetentionHandler5A61189F', 'Arn'] },
      },
    });
  });
});
