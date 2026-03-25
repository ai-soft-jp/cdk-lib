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
export declare class Ec2InstanceConnectEndpoint extends cdk.Resource implements ec2.IConnectable, ec2.IInstanceConnectEndpointRef {
    readonly connections: ec2.Connections;
    readonly instanceConnectEndpointRef: ec2.InstanceConnectEndpointReference;
    readonly instanceConnectEndpointId: string;
    constructor(scope: Construct, id: string, props: Ec2InstanceConnectEndpointProps);
    /**
     * Connect to EC2 instance security group
     * @param destination The EC2 instance or the security group
     * @param port SSH Port (default: 22)
     */
    connect(destination: ec2.IConnectable, port?: ec2.Port): void;
}
