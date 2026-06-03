import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
/**
 * Properties for VpcOriginSecurityGroup
 */
export interface VpcOriginSecurityGroupProps {
    /**
     * The VPC
     */
    readonly vpc: ec2.IVPCRef;
    /**
     * Add dependency to VPC origins automatically
     * @default true
     */
    readonly dependency?: boolean;
}
/**
 * CloudFront-VPCOrigins-Service-SG security group
 */
export declare class VpcOriginSecurityGroup extends Construct implements ec2.IConnectable {
    readonly connections: ec2.Connections;
    constructor(scope: Construct, id: string, props: VpcOriginSecurityGroupProps);
}
