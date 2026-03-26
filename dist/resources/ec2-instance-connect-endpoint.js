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
        this.connections = securityGroup.connections;
        const resource = new ec2.CfnInstanceConnectEndpoint(this, 'Resource', {
            subnetId,
            securityGroupIds: [securityGroup.securityGroupId],
            preserveClientIp: props.preserveClientIp,
            tags: [{ key: 'Name', value: this.node.path }],
        });
        for (const sg of props.securityGroups ?? []) {
            this.connect(sg, props.port);
        }
        this.instanceConnectEndpointRef = resource.instanceConnectEndpointRef;
        this.instanceConnectEndpointId = resource.attrId;
    }
    /**
     * Connect to EC2 instance security group
     * @param destination The EC2 instance or the security group
     * @param port SSH Port (default: 22)
     */
    connect(destination, port) {
        for (const sg of destination.connections.securityGroups) {
            this.securityGroup.addEgressRule(sg, port ?? ec2.Port.SSH, 'to EC2', true);
            sg.addIngressRule(this.securityGroup, port ?? ec2.Port.SSH, 'from EIC');
            if (!sg.allowAllOutbound) {
                sg.addEgressRule(this.securityGroup, ec2.Port.allTraffic(), 'to EIC');
            }
        }
    }
}
//# sourceMappingURL=ec2-instance-connect-endpoint.js.map