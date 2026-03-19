import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cr from 'aws-cdk-lib/custom-resources';
/**
 * CloudFront-VPCOrigins-Service-SG security group
 */
export class VpcOriginSecurityGroup extends cdk.Resource {
    connections;
    constructor(scope, id, props) {
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
        });
        const securityGroupId = getSg.getResponseField('SecurityGroups.0.GroupId');
        const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(this, 'SecurityGroup', securityGroupId);
        this.connections = securityGroup.connections;
    }
}
//# sourceMappingURL=vpc-origin-security-group.js.map