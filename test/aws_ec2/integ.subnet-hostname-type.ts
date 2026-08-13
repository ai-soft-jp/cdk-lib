import { ExpectedResult, IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ais from '../../lib';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'SubnetHostnameTypeIntegTest');

const vpc = new ec2.Vpc(stack, 'Vpc', {
  natGateways: 0,
  ipProtocol: ec2.IpProtocol.DUAL_STACK,
  restrictDefaultSecurityGroup: false,
});
vpc.with(new ais.ec2.SubnetHostnameTypeToResourceNameMixin());

const integ = new IntegTest(app, 'integ-test', {
  testCases: [stack],
});
for (const subnet of [...vpc.publicSubnets, ...vpc.isolatedSubnets]) {
  integ.assertions
    .awsApiCall('ec2', 'describeSubnets', {
      SubnetIds: [subnet.subnetId],
    })
    .expect(
      ExpectedResult.objectLike({
        Subnets: [
          {
            PrivateDnsNameOptionsOnLaunch: {
              HostnameType: 'resource-name',
              EnableResourceNameDnsARecord: true,
              EnableResourceNameDnsAAAARecord: true,
            },
          },
        ],
      }),
    );
}
