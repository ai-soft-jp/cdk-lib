import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
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
  /**
   * The security groups to be connected
   * @default - No security groups
   */
  readonly securityGroups?: ec2.ISecurityGroup[];
  /**
   * The SSH port
   * @default ec2.Port.SSH
   */
  readonly port?: ec2.Port;
}

/**
 * EC2 Instance Connect (EIC) Endpoint
 */
export class Ec2InstanceConnectEndpoint
  extends cdk.Resource
  implements ec2.IConnectable, ec2.IInstanceConnectEndpointRef
{
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
      throw new cdk.ValidationError('No Subnect Id available', this);
    }

    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc: props.vpc,
      description: 'EIC Endpoint Security Group',
      allowAllOutbound: false,
      allowAllIpv6Outbound: false,
    });
    this.connections = securityGroup.connections;

    const resource = new ec2.CfnInstanceConnectEndpoint(this, 'Resource', {
      subnetId,
      securityGroupIds: [securityGroup.securityGroupId],
      preserveClientIp: props.preserveClientIp,
      tags: [{ key: 'Name', value: this.node.path }],
    });

    for (const sg of props.securityGroups ?? []) {
      this.connect(sg, props.port);
    }

    this.instanceConnectEndpointRef = resource.instanceConnectEndpointRef;
    this.instanceConnectEndpointId = resource.attrId;
  }

  /**
   * Connect to EC2 instance security group
   * @param destination The EC2 instance or the security group
   * @param port SSH Port (default: 22)
   */
  connect(destination: ec2.IConnectable, port?: ec2.Port) {
    this.connections.allowTo(destination, port ?? ec2.Port.SSH, 'to EC2');
    destination.connections.allowFrom(this, port ?? ec2.Port.SSH, 'from EIC');
    destination.connections.allowTo(this, ec2.Port.allTraffic(), 'to EIC');
  }
}
