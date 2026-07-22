import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ais from '../../lib';

describe('RebootAlarm', () => {
  let stack: cdk.Stack;
  let vpc: ec2.Vpc;
  beforeEach(() => {
    stack = new cdk.Stack();
    vpc = new ec2.Vpc(stack, 'Vpc');
  });

  test('defines reboot alarm', () => {
    const instance = new ec2.Instance(stack, 'Instance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
    });
    new ais.ec2.RebootAlarm(stack, 'RebootAlarm', { instance });

    Template.fromStack(stack).hasResourceProperties('AWS::CloudWatch::Alarm', {
      Namespace: 'AWS/EC2',
      MetricName: 'StatusCheckFailed',
      Dimensions: [{ Name: 'InstanceId', Value: { Ref: 'InstanceC1063A87' } }],
      Period: 60,
      EvaluationPeriods: 10,
      Threshold: 0,
      ComparisonOperator: 'GreaterThanThreshold',
      AlarmActions: [
        { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':automate:', { Ref: 'AWS::Region' }, ':ec2:reboot']] },
      ],
    });
  });
});
