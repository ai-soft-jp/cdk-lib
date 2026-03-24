import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
/**
 * EC2 Instance Connect (EIC) Endpoint
 */
export class Ec2InstanceConnectEndpoint extends cdk.Resource {
    connections;
    constructor(scope, id, props) {
        super(scope, id);
        const subnetId = props.vpc.selectSubnets({
            availabilityZones: props.availabilityZone ? [props.availabilityZone] : undefined,
            subnetType: ec2.SubnetType.PUBLIC,
            onePerAz: true,
        }).subnetIds[0];
        if (!subnetId) {
            throw new cdk.ValidationError('No Subnect Id available', this);
        }
        const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
            vpc: props.vpc,
            description: 'EIC Endpoint Security Group',
            allowAllOutbound: false,
            allowAllIpv6Outbound: false,
        });
        this.connections = securityGroup.connections;
        new ec2.CfnInstanceConnectEndpoint(this, 'Resource', {
            subnetId,
            securityGroupIds: [securityGroup.securityGroupId],
            preserveClientIp: props.preserveClientIp,
            tags: [{ key: 'Name', value: this.node.path }],
        });
        for (const sg of props.securityGroups ?? []) {
            this.connect(sg, props.port);
        }
    }
    /**
     * Connect to EC2 instance security group
     * @param destination The EC2 instance or the security group
     * @param port SSH Port (default: 22)
     */
    connect(destination, port) {
        this.connections.allowTo(destination, port ?? ec2.Port.SSH, 'to EC2');
        destination.connections.allowFrom(this, port ?? ec2.Port.SSH, 'from EIC');
        destination.connections.allowTo(this, ec2.Port.allTraffic(), 'to EIC');
    }
}
//# sourceMappingURL=ec2-instance-connect-endpoint.js.map