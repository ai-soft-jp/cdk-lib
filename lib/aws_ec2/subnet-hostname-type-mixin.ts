import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import type { IConstruct } from 'constructs';

export class SubnetHostnameTypeToResourceNameMixin extends cdk.Mixin {
  supports(construct: IConstruct): boolean {
    return ec2.CfnSubnet.isCfnSubnet(construct);
  }

  applyTo(subnet: ec2.CfnSubnet): void {
    subnet.privateDnsNameOptionsOnLaunch = {
      EnableResourceNameDnsAAAARecord: true,
      EnableResourceNameDnsARecord: true,
      HostnameType: 'resource-name',
    };
  }
}
