import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import type { Construct } from 'constructs';
/**
 * Properties for VpcOriginSecurityGroup
 */
export interface VpcOriginSecurityGroupProps {
    /**
     * The VPC
     */
    readonly vpc: ec2.IVPCRef;
}
/**
 * CloudFront-VPCOrigins-Service-SG security group
 */
export declare class VpcOriginSecurityGroup extends cdk.Resource implements ec2.IConnectable {
    readonly connections: ec2.Connections;
    constructor(scope: Construct, id: string, props: VpcOriginSecurityGroupProps);
}
