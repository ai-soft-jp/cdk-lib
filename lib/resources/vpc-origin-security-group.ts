import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cr from 'aws-cdk-lib/custom-resources';
import type { IConstruct } from 'constructs';
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
export class VpcOriginSecurityGroup extends Construct implements ec2.IConnectable {
  readonly connections: ec2.Connections;

  constructor(scope: Construct, id: string, props: VpcOriginSecurityGroupProps) {
    super(scope, id);

    const getSg = new cr.AwsCustomResource(this, 'Default', {
      resourceType: 'Custom::VpcOriginServiceSecurityGroup',
      onUpdate: {
        service: 'ec2',
        action: 'DescribeSecurityGroups',
        parameters: {
          Filters: [
            { Name: 'vpc-id', Values: [props.vpc.vpcRef.vpcId] },
            { Name: 'group-name', Values: ['CloudFront-VPCOrigins-Service-SG'] },
          ],
        },
        physicalResourceId: cr.PhysicalResourceId.fromResponse('SecurityGroups.0.GroupId'),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({ resources: ['*'] }),
      installLatestAwsSdk: false,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    if (props.dependency ?? true) {
      cdk.Aspects.of(cdk.Stack.of(this)).add(new ApplyVpcOriginDependency(getSg), {
        priority: cdk.AspectPriority.READONLY,
      });
    }

    const securityGroupId = getSg.getResponseField('SecurityGroups.0.GroupId');
    const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, 'SecurityGroup', securityGroupId);
    this.connections = securityGroup.connections;
  }
}

class ApplyVpcOriginDependency implements cdk.IAspect {
  constructor(protected readonly construct: IConstruct) {}
  public visit(node: IConstruct) {
    if (cloudfront.CfnVpcOrigin.isCfnVpcOrigin(node)) {
      this.construct.node.addDependency(node);
    }
  }
}
