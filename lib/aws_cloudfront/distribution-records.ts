import * as cdk from 'aws-cdk-lib';
import type * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
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
   */
  readonly recordName: string;
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
   * The TTL of MX and SPF records
   * @default - 1800 seconds
   */
  readonly ttl?: cdk.Duration;
  /**
   * The weight of records
   * @default - No weight
   */
  readonly weight?: number;
}

/**
 * The IP address type
 */
export enum IpAddressType {
  /** Dualstack (A and AAAA records) */
  DUALSTACK = 'DUALSTACK',
  /** IPv4 (A record) only */
  IPV4_ONLY = 'IPV4_ONLY',
  /** IPv6 (AAAA record) only */
  IPV6_ONLY = 'IPV6_ONLY',
}

/**
 * Publish Route53 records for CloudFront distribution
 */
export class DistributionRecords extends Construct {
  constructor(scope: Construct, id: string, props: DistributionRecordsProps) {
    super(scope, id);

    const recordProps = { zone: props.zone, recordName: props.recordName, weight: props.weight };
    const target = route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(props.distribution));

    const ipAddressType = props.ipAddressType ?? IpAddressType.DUALSTACK;
    if (ipAddressType === IpAddressType.DUALSTACK || ipAddressType === IpAddressType.IPV4_ONLY) {
      new route53.ARecord(this, 'A', { ...recordProps, target });
    }
    if (ipAddressType === IpAddressType.DUALSTACK || ipAddressType === IpAddressType.IPV6_ONLY) {
      new route53.AaaaRecord(this, 'AAAA', { ...recordProps, target });
    }
    if (props.httpsRecord ?? true) {
      new route53.HttpsRecord(this, 'HTTPS', { ...recordProps, target });
    }

    if (props.mxRecord ?? true) {
      new route53.MxRecord(this, 'MX', { ...recordProps, values: [{ hostName: '.', priority: 0 }], ttl: props.ttl });
      new route53.TxtRecord(this, 'SPF', { ...recordProps, values: ['v=spf1 -all'], ttl: props.ttl });
    }

    // AliasTarget: AliasTarget cannot be used with record type 'HTTPS' (CloudFormation Validate)
    // https://github.com/aws-cloudformation/cloudformation-validate/issues/246
    cdk.Validations.of(this).acknowledge({ id: 'CloudFormation-Validate::E3029', reason: 'false positive' });
  }
}
