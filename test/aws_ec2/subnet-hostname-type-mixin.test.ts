import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ais from '../../lib';

describe('SubnetHostnameTypeToResourceNameMixin', () => {
  let stack: cdk.Stack;
  let vpc: ec2.Vpc;
  beforeEach(() => {
    stack = new cdk.Stack();
    vpc = new ec2.Vpc(stack, 'Vpc');
  });

  test('applies to all subnets', () => {
    vpc.with(new ais.ec2.SubnetHostnameTypeToResourceNameMixin());
    const resources = Template.fromStack(stack).findResources('AWS::EC2::Subnet', {
      Properties: {
        PrivateDnsNameOptionsOnLaunch: {
          EnableResourceNameDnsAAAARecord: true,
          EnableResourceNameDnsARecord: true,
          HostnameType: 'resource-name',
        },
      },
    });
    expect(Object.keys(resources)).toHaveLength(4);
  });
});
