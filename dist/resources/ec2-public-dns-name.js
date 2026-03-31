import { RemovalPolicy, ValidationError } from 'aws-cdk-lib';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
export class Ec2PublicDnsName extends Construct {
    publicIpv4DnsName;
    publicIpv6DnsName;
    publicDualStackDnsName;
    constructor(scope, id, props) {
        super(scope, id);
        const filters = [];
        if (props.instance) {
            filters.push({ Name: 'attachment.instance-id', Values: [props.instance.instanceRef.instanceId] });
        }
        if (props.eip) {
            filters.push({ Name: 'association.public-ip', Values: [props.eip.eipRef.publicIp] });
        }
        if (!filters.length) {
            throw new ValidationError('TargetMissing', 'At least instance or eip is needed.', this);
        }
        const eni = new cr.AwsCustomResource(this, 'Default', {
            resourceType: 'Custom::DescribeNetworkInterfaces',
            policy: cr.AwsCustomResourcePolicy.fromSdkCalls({ resources: ['*'] }),
            onCreate: {
                service: 'ec2',
                action: 'describeNetworkInterfaces',
                parameters: { Filters: filters },
                physicalResourceId: cr.PhysicalResourceId.fromResponse('NetworkInterfaces.0.NetworkInterfaceId'),
            },
            removalPolicy: RemovalPolicy.RETAIN,
        });
        this.publicIpv4DnsName = eni.getResponseField('NetworkInterfaces.0.PublicIpDnsNameOptions.PublicIpv4DnsName');
        this.publicIpv6DnsName = eni.getResponseField('NetworkInterfaces.0.PublicIpDnsNameOptions.PublicIpv6DnsName');
        this.publicDualStackDnsName = eni.getResponseField('NetworkInterfaces.0.PublicIpDnsNameOptions.PublicDualStackDnsName');
    }
}
//# sourceMappingURL=ec2-public-dns-name.js.map