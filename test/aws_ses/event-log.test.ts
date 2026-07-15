import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as ais from '../../lib';

describe('EventLog', () => {
  let stack: cdk.Stack;
  beforeEach(() => {
    stack = new cdk.Stack();
  });

  test('defines a configuration set destination', () => {
    const configurationSet = new ses.ConfigurationSet(stack, 'ConfigurationSet');
    new ais.ses.EventLog(stack, 'EventLog', { configurationSet });
    Template.fromStack(stack).hasResourceProperties('AWS::SES::ConfigurationSetEventDestination', {
      EventDestination: {
        Enabled: true,
        SnsDestination: { TopicARN: { Ref: 'EventLogTopicD6F9D6C8' } },
      },
    });
  });
});
