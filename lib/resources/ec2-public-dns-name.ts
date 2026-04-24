import { RemovalPolicy, ValidationError } from 'aws-cdk-lib';
import type * as ec2 from 'aws-cdk-lib/aws-ec2';
import { lit } from 'aws-cdk-lib/core/lib/helpers-internal';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

interface Ec2PublicDnsNameProps {
  readonly networkInterface?: ec2.INetworkInterfaceRef;
  readonly instance?: ec2.IInstanceRef;
  readonly deviceIndex?: string;
  readonly publicIp?: string;
  readonly privateIp?: string;
}

export class Ec2PublicDnsName extends Construct {
  private resource: cr.AwsCustomResource;

  constructor(scope: Construct, id: string, props: Ec2PublicDnsNameProps) {
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
      throw new ValidationError(lit`TargetMissing`, 'At least instance or publicIp is needed.', this);
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

  public getResponseField(dataPath: string) {
    return this.resource.getResponseField(dataPath);
  }

  public getResponseFieldReference(dataPath: string) {
    return this.resource.getResponseFieldReference(dataPath);
  }

  public get publicIpv4Address() {
    return this.getResponseField('NetworkInterfaces.0.Association.PublicIp');
  }

  public get publicIpv4DnsName() {
    return this.getResponseField('NetworkInterfaces.0.PublicIpDnsNameOptions.PublicIpv4DnsName');
  }

  public get publicIpv6Address() {
    return this.getResponseField('NetworkInterfaces.0.Ipv6Address');
  }

  public get publicIpv6DnsName() {
    return this.getResponseField('NetworkInterfaces.0.PublicIpDnsNameOptions.PublicIpv6DnsName');
  }

  public get publicDualStackDnsName() {
    return this.getResponseField('NetworkInterfaces.0.PublicIpDnsNameOptions.PublicDualStackDnsName');
  }
}
