import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { lit } from 'aws-cdk-lib/core/lib/helpers-internal';
import type { Construct } from 'constructs';

/**
 * Properties for Ec2InstanceConnectEndpoint
 */
export interface Ec2InstanceConnectEndpointProps {
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
export class Ec2InstanceConnectEndpoint
  extends cdk.Resource
  implements ec2.IConnectable, ec2.IInstanceConnectEndpointRef
{
  readonly securityGroup: ec2.SecurityGroup;
  readonly connections: ec2.Connections;
  readonly instanceConnectEndpointRef: ec2.InstanceConnectEndpointReference;
  readonly instanceConnectEndpointId: string;

  constructor(scope: Construct, id: string, props: Ec2InstanceConnectEndpointProps) {
    super(scope, id);

    const subnetId = props.vpc.selectSubnets({
      availabilityZones: props.availabilityZone ? [props.availabilityZone] : undefined,
      subnetType: ec2.SubnetType.PUBLIC,
      onePerAz: true,
    }).subnetIds[0];
    if (!subnetId) {
      throw new cdk.ValidationError(lit`SubnetNotFound`, 'No Subnect Id available', this);
    }

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
