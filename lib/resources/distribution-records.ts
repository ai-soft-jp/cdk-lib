import { Resource } from 'aws-cdk-lib';
import type * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import type { Construct } from 'constructs';

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
export class DistributionRecords extends Resource {
  constructor(scope: Construct, id: string, props: DistributionRecordsProps) {
    super(scope, id);

    const { zone, recordName } = props;
    const target = route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(props.distribution));
    const weight = props.weight != null ? { weight: props.weight } : undefined;
    const multiValue = props.weight != null ? { multiValueAnswer: true } : undefined;

    const ipAddressType = props.ipAddressType ?? IpAddressType.DUALSTACK;
    if (ipAddressType === IpAddressType.DUALSTACK || ipAddressType === IpAddressType.IPV4_ONLY) {
      new route53.ARecord(this, 'A', { zone, recordName, target, ...weight });
    }
    if (ipAddressType === IpAddressType.DUALSTACK || ipAddressType === IpAddressType.IPV6_ONLY) {
      new route53.AaaaRecord(this, 'AAAA', { zone, recordName, target, ...weight });
    }
    if (props.httpsRecord ?? true) {
      new route53.HttpsRecord(this, 'HTTPS', { zone, recordName, target, ...weight });
    }

    if (props.mxRecord ?? true) {
      new route53.MxRecord(this, 'MX', {
        zone,
        recordName,
        values: [{ hostName: '.', priority: 0 }],
        ...multiValue,
      });
      new route53.TxtRecord(this, 'SPF', { zone, recordName, values: ['v=spf1 -all'], ...multiValue });
    }
  }
}
