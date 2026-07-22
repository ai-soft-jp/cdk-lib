import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ais from '../../lib';

describe('PublicDnsName', () => {
  let stack: cdk.Stack;
  let vpc: ec2.Vpc;
  beforeEach(() => {
    stack = new cdk.Stack();
    vpc = new ec2.Vpc(stack, 'Vpc');
  });

  test('target by ENI', () => {
    const networkInterface = new ec2.CfnNetworkInterface(stack, 'NetworkInterface', {
      subnetId: vpc.publicSubnets[0]!,
    });
    new ais.ec2.PublicDnsName(stack, 'PublicDnsName', { networkInterface });
    Template.fromStack(stack).hasResourceProperties('Custom::DescribeNetworkInterfaces', {
      Update: {
        'Fn::Join': [
          '',
          Match.arrayWith([Match.stringLikeRegexp('"Name":"network-interface-id"'), { Ref: 'NetworkInterface' }]),
        ],
      },
    });
  });

  test('target by instance', () => {
    const instance = new ec2.Instance(stack, 'Instance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
    });
    new ais.ec2.PublicDnsName(stack, 'PublicDnsName', { instance });
    Template.fromStack(stack).hasResourceProperties('Custom::DescribeNetworkInterfaces', {
      Update: {
        'Fn::Join': [
          '',
          Match.arrayWith([Match.stringLikeRegexp('"Name":"attachment.instance-id"'), { Ref: 'InstanceC1063A87' }]),
        ],
      },
    });
  });

  test('target by device index', () => {
    new ais.ec2.PublicDnsName(stack, 'PublicDnsName', { deviceIndex: 'deadbeef' });
    Template.fromStack(stack).hasResourceProperties('Custom::DescribeNetworkInterfaces', {
      Update: Match.stringLikeRegexp('"Name":"attachment.device-index","Values":\\["deadbeef"\\]'),
    });
  });

  test('target by public ip', () => {
    new ais.ec2.PublicDnsName(stack, 'PublicDnsName', { publicIp: 'deadbeef' });
    Template.fromStack(stack).hasResourceProperties('Custom::DescribeNetworkInterfaces', {
      Update: Match.stringLikeRegexp('"Name":"association.public-ip","Values":\\["deadbeef"\\]'),
    });
  });

  test('target by private ip', () => {
    new ais.ec2.PublicDnsName(stack, 'PublicDnsName', { privateIp: 'deadbeef' });
    Template.fromStack(stack).hasResourceProperties('Custom::DescribeNetworkInterfaces', {
      Update: Match.stringLikeRegexp('"Name":"addresses.private-ip-address","Values":\\["deadbeef"\\]'),
    });
  });

  test('throws if no criteria provided', () => {
    expect(() => {
      new ais.ec2.PublicDnsName(stack, 'PublicDnsName', {});
    }).toThrow('At least one criterion is needed.');
  });
});
