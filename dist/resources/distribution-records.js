import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';
/**
 * The IP address type
 */
export var IpAddressType;
(function (IpAddressType) {
    /** Dualstack (A and AAAA records) */
    IpAddressType["DUALSTACK"] = "DUALSTACK";
    /** IPv4 (A record) only */
    IpAddressType["IPV4_ONLY"] = "IPV4_ONLY";
    /** IPv6 (AAAA record) only */
    IpAddressType["IPV6_ONLY"] = "IPV6_ONLY";
})(IpAddressType || (IpAddressType = {}));
/**
 * Publish Route53 records for CloudFront distribution
 */
export class DistributionRecords extends Construct {
    constructor(scope, id, props) {
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
//# sourceMappingURL=distribution-records.js.map