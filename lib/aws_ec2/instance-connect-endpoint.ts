import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import type { Construct } from 'constructs';

/**
 * Properties for InstanceConnectEndpoint
 */
export interface InstanceConnectEndpointProps {
  /**
   * The VPC
   */
  readonly vpc: ec2.IVpc;
  /**
   * The AZ of EIC Endpoint
   * @default - The first AZ of the VPC
   */
  readonly availabilityZone?: string;
  /**
   * Indicates whether the client IP address is preserved as the source.
   * @default false
   */
  readonly preserveClientIp?: boolean;
}

/**
 * EC2 Instance Connect (EIC) Endpoint
 */
export class InstanceConnectEndpoint extends cdk.Resource implements ec2.IConnectable, ec2.IInstanceConnectEndpointRef {
  readonly securityGroup: ec2.SecurityGroup;
  readonly connections: ec2.Connections;
  readonly instanceConnectEndpointRef: ec2.InstanceConnectEndpointReference;
  readonly instanceConnectEndpointId: string;

  constructor(scope: Construct, id: string, props: InstanceConnectEndpointProps) {
    super(scope, id);

    const subnets = props.vpc.selectSubnets({
      availabilityZones: props.availabilityZone ? [props.availabilityZone] : undefined,
      subnetType: ec2.SubnetType.PUBLIC,
      onePerAz: true,
    });
    const subnetId = subnets.isPendingLookup ? 'subnet-deadbeef' : subnets.subnetIds[0]!;

    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc: props.vpc,
      description: 'EIC Endpoint Security Group',
      allowAllOutbound: false,
      allowAllIpv6Outbound: false,
    });
    this.securityGroup = securityGroup;
    this.connections = new ec2.Connections({
      securityGroups: [securityGroup],
      defaultPort: ec2.Port.SSH,
    });

    const resource = new ec2.CfnInstanceConnectEndpoint(this, 'Resource', {
      subnetId,
      securityGroupIds: [securityGroup.securityGroupId],
      preserveClientIp: props.preserveClientIp,
      tags: [{ key: 'Name', value: this.node.path }],
    });

    this.instanceConnectEndpointRef = resource.instanceConnectEndpointRef;
    this.instanceConnectEndpointId = resource.attrId;
  }
}
