import { RemovalPolicy, ValidationError } from 'aws-cdk-lib';
import { lit } from 'aws-cdk-lib/core/lib/helpers-internal';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
export class Ec2PublicDnsName extends Construct {
    resource;
    constructor(scope, id, props) {
        super(scope, id);
        const filters = [];
        if (props.networkInterface) {
            filters.push({
                Name: 'network-interface-id',
                Values: [props.networkInterface.networkInterfaceRef.networkInterfaceId],
            });
        }
        if (props.instance) {
            filters.push({ Name: 'attachment.instance-id', Values: [props.instance.instanceRef.instanceId] });
        }
        if (props.deviceIndex) {
            filters.push({ Name: 'attachment.device-index', Values: [props.deviceIndex] });
        }
        if (props.publicIp) {
            filters.push({ Name: 'association.public-ip', Values: [props.publicIp] });
        }
        if (props.privateIp) {
            filters.push({ Name: 'addresses.private-ip-address', Values: [props.privateIp] });
        }
        if (!filters.length) {
            throw new ValidationError(lit `TargetMissing`, 'At least instance or publicIp is needed.', this);
        }
        this.resource = new cr.AwsCustomResource(this, 'Default', {
            resourceType: 'Custom::DescribeNetworkInterfaces',
            policy: cr.AwsCustomResourcePolicy.fromSdkCalls({ resources: ['*'] }),
            onUpdate: {
                service: 'ec2',
                action: 'describeNetworkInterfaces',
                parameters: { Filters: filters },
                physicalResourceId: cr.PhysicalResourceId.fromResponse('NetworkInterfaces.0.NetworkInterfaceId'),
            },
            removalPolicy: RemovalPolicy.RETAIN,
        });
    }
    getResponseField(dataPath) {
        return this.resource.getResponseField(dataPath);
    }
    getResponseFieldReference(dataPath) {
        return this.resource.getResponseFieldReference(dataPath);
    }
    get publicIpv4Address() {
        return this.getResponseField('NetworkInterfaces.0.Association.PublicIp');
    }
    get publicIpv4DnsName() {
        return this.getResponseField('NetworkInterfaces.0.PublicIpDnsNameOptions.PublicIpv4DnsName');
    }
    get publicIpv6Address() {
        return this.getResponseField('NetworkInterfaces.0.Ipv6Address');
    }
    get publicIpv6DnsName() {
        return this.getResponseField('NetworkInterfaces.0.PublicIpDnsNameOptions.PublicIpv6DnsName');
    }
    get publicDualStackDnsName() {
        return this.getResponseField('NetworkInterfaces.0.PublicIpDnsNameOptions.PublicDualStackDnsName');
    }
}
//# sourceMappingURL=ec2-public-dns-name.js.map