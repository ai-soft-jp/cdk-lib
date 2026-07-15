import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ais from '../../lib';

describe('InstanceConnectEndpoint', () => {
  let stack: cdk.Stack;
  let vpc: ec2.Vpc;
  beforeEach(() => {
    stack = new cdk.Stack();
    vpc = new ec2.Vpc(stack, 'Vpc');
  });

  test('EIC endpoint in the default AZ', () => {
    new ais.ec2.InstanceConnectEndpoint(stack, 'InstanceConnectEndpoint', { vpc });
    Template.fromStack(stack).hasResourceProperties('AWS::EC2::InstanceConnectEndpoint', {
      SubnetId: { Ref: 'VpcPublicSubnet1Subnet5C2D37C4' },
    });
  });

  test('EIC endpoint in the specified AZ', () => {
    new ais.ec2.InstanceConnectEndpoint(stack, 'InstanceConnectEndpoint', {
      vpc,
      availabilityZone: vpc.availabilityZones[1],
    });
    Template.fromStack(stack).hasResourceProperties('AWS::EC2::InstanceConnectEndpoint', {
      SubnetId: { Ref: 'VpcPublicSubnet2Subnet691E08A3' },
    });
  });

  test('EIC endpoint with preserveClientIp', () => {
    new ais.ec2.InstanceConnectEndpoint(stack, 'InstanceConnectEndpoint', { vpc, preserveClientIp: true });
    Template.fromStack(stack).hasResourceProperties('AWS::EC2::InstanceConnectEndpoint', {
      PreserveClientIp: true,
    });
  });

  test('security group entries', () => {
    const sg = new ec2.SecurityGroup(stack, 'SecurityGroup', { vpc });
    const eic = new ais.ec2.InstanceConnectEndpoint(stack, 'InstanceConnectEndpoint', { vpc });
    sg.connections.allowFrom(eic, ec2.Port.tcp(22), 'Allow SSH from EIC');
    Template.fromStack(stack).hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      GroupId: { 'Fn::GetAtt': ['SecurityGroupDD263621', 'GroupId'] },
      SourceSecurityGroupId: { 'Fn::GetAtt': ['InstanceConnectEndpointSecurityGroupA4363F4A', 'GroupId'] },
      ToPort: 22,
      FromPort: 22,
    });
    Template.fromStack(stack).hasResourceProperties('AWS::EC2::SecurityGroupEgress', {
      GroupId: { 'Fn::GetAtt': ['InstanceConnectEndpointSecurityGroupA4363F4A', 'GroupId'] },
      DestinationSecurityGroupId: { 'Fn::GetAtt': ['SecurityGroupDD263621', 'GroupId'] },
      ToPort: 22,
      FromPort: 22,
    });
  });
});
