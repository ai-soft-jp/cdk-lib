import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
/**
 * EC2 Instance Connect (EIC) Endpoint
 */
export class Ec2InstanceConnectEndpoint extends cdk.Resource {
    securityGroup;
    connections;
    instanceConnectEndpointRef;
    instanceConnectEndpointId;
    constructor(scope, id, props) {
        super(scope, id);
        const subnetId = props.vpc.selectSubnets({
            availabilityZones: props.availabilityZone ? [props.availabilityZone] : undefined,
            subnetType: ec2.SubnetType.PUBLIC,
            onePerAz: true,
        }).subnetIds[0];
        if (!subnetId) {
            throw new cdk.ValidationError('SubnetNotFound', 'No Subnect Id available', this);
        }
        const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
            vpc: props.vpc,
            description: 'EIC Endpoint Security Group',
            allowAllOutbound: false,
            allowAllIpv6Outbound: false,
        });
        this.securityGroup = securityGroup;
        this.connections = new ec2.Connections({
            securityGroups: [securityGroup],
            defaultPort: ec2.Port.SSH,
        });
        const resource = new ec2.CfnInstanceConnectEndpoint(this, 'Resource', {
            subnetId,
            securityGroupIds: [securityGroup.securityGroupId],
            preserveClientIp: props.preserveClientIp,
            tags: [{ key: 'Name', value: this.node.path }],
        });
        this.instanceConnectEndpointRef = resource.instanceConnectEndpointRef;
        this.instanceConnectEndpointId = resource.attrId;
    }
}
//# sourceMappingURL=ec2-instance-connect-endpoint.js.map