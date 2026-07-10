import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ais from '../../lib';

describe('VpcOriginSecurityGroup', () => {
  let stack: cdk.Stack;
  let vpc: ec2.Vpc;
  beforeEach(() => {
    stack = new cdk.Stack();
    vpc = new ec2.Vpc(stack, 'Vpc');
  });

  test('can connect', () => {
    const sg = new ec2.SecurityGroup(stack, 'SG', { vpc });
    const sgVpc = new ais.cloudfront.VpcOriginSecurityGroup(stack, 'VpcSG', { vpc });
    sg.connections.allowFrom(sgVpc, ec2.Port.HTTP);

    Template.fromStack(stack).hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      ToPort: 80,
      SourceSecurityGroupId: { 'Fn::GetAtt': ['VpcSG7696B04E', 'SecurityGroups.0.GroupId'] },
    });
  });

  test('depends on vpc origins automatically', () => {
    const instance = new ec2.Instance(stack, 'Instance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.SMALL),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
    });
    new ais.cloudfront.VpcOriginSecurityGroup(stack, 'VpcSG', { vpc });
    new cloudfront.Distribution(stack, 'Distribution', {
      defaultBehavior: {
        origin: origins.VpcOrigin.withEc2Instance(instance),
      },
    });

    Template.fromStack(stack).hasResource('Custom::VpcOriginServiceSecurityGroup', {
      DependsOn: Match.arrayWith(['DistributionOrigin1VpcOrigin1389D846']),
    });
  });
});
