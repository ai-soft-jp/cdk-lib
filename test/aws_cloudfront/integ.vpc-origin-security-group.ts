import { ExpectedResult, IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ais from '../../lib';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'VpcOriginSecurityGroupIntegTest');

const vpc = new ec2.Vpc(stack, 'Vpc', { natGateways: 1 });
const instance = new ec2.Instance(stack, 'Instance', {
  vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
  machineImage: ec2.MachineImage.latestAmazonLinux2023({ cpuType: ec2.AmazonLinuxCpuType.ARM_64 }),
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
  init: ec2.CloudFormationInit.fromElements(
    ec2.InitCommand.shellCommand('dnf install nginx -y'),
    ec2.InitCommand.shellCommand('systemctl start nginx'),
  ),
});
const sgVpc = new ais.cloudfront.VpcOriginSecurityGroup(stack, 'VpcSG', { vpc });
instance.connections.allowFrom(sgVpc, ec2.Port.HTTP, 'from VpcSG');

const distribution = new cloudfront.Distribution(stack, 'Distribution', {
  defaultBehavior: {
    origin: origins.VpcOrigin.withEc2Instance(instance, { protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY }),
  },
});

const integ = new IntegTest(app, 'integ-test', {
  testCases: [stack],
});
integ.assertions
  .httpApiCall(`https://${distribution.distributionDomainName}/`)
  .expect(ExpectedResult.objectLike({ status: 200 }));
