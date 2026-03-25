import type * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
/**
 * Properties for DistributionRecords resource
 */
export interface DistributionRecordsProps {
    /**
     * The distribution
     */
    readonly distribution: cloudfront.IDistribution;
    /**
     * The hosted zone
     */
    readonly zone: route53.IHostedZone;
    /**
     * The record name
     * @default - zone apex
     */
    readonly recordName?: string;
    /**
     * The IP address type
     * @default IpAddressType.DUALSTACK
     */
    readonly ipAddressType?: IpAddressType;
    /**
     * Whether to publish HTTPS record
     * @default true
     */
    readonly httpsRecord?: boolean;
    /**
     * Whether to publish MX and SPF records
     * @default true
     */
    readonly mxRecord?: boolean;
    /**
     * The weight of records
     * @default - No weight
     */
    readonly weight?: number;
}
/**
 * The IP address type
 */
export declare enum IpAddressType {
    /** Dualstack (A and AAAA records) */
    DUALSTACK = "DUALSTACK",
    /** IPv4 (A record) only */
    IPV4_ONLY = "IPV4_ONLY",
    /** IPv6 (AAAA record) only */
    IPV6_ONLY = "IPV6_ONLY"
}
/**
 * Publish Route53 records for CloudFront distribution
 */
export declare class DistributionRecords extends Construct {
    constructor(scope: Construct, id: string, props: DistributionRecordsProps);
}
