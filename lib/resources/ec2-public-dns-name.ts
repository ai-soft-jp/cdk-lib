import { RemovalPolicy, ValidationError } from 'aws-cdk-lib';
import type * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

interface Ec2PublicDnsNameProps {
  readonly instance?: ec2.IInstanceRef;
  readonly publicIp?: string;
}

export class Ec2PublicDnsName extends Construct {
  public readonly publicIpv4DnsName: string;
  public readonly publicIpv6DnsName: string;
  public readonly publicDualStackDnsName: string;

  constructor(scope: Construct, id: string, props: Ec2PublicDnsNameProps) {
    super(scope, id);

    const filters = [];
    if (props.instance) {
      filters.push({ Name: 'attachment.instance-id', Values: [props.instance.instanceRef.instanceId] });
    }
    if (props.publicIp) {
      filters.push({ Name: 'association.public-ip', Values: [props.publicIp] });
    }
    if (!filters.length) {
      throw new ValidationError('TargetMissing', 'At least instance or publicIp is needed.', this);
    }

    const eni = new cr.AwsCustomResource(this, 'Default', {
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

    this.publicIpv4DnsName = eni.getResponseField('NetworkInterfaces.0.PublicIpDnsNameOptions.PublicIpv4DnsName');
    this.publicIpv6DnsName = eni.getResponseField('NetworkInterfaces.0.PublicIpDnsNameOptions.PublicIpv6DnsName');
    this.publicDualStackDnsName = eni.getResponseField(
      'NetworkInterfaces.0.PublicIpDnsNameOptions.PublicDualStackDnsName',
    );
  }
}
