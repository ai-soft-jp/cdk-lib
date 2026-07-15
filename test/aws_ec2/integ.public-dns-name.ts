import { ExpectedResult, IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ais from '../../lib';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'PublicDnsNameIntegTest');

const vpc = new ec2.Vpc(stack, 'Vpc', {
  natGateways: 0,
  restrictDefaultSecurityGroup: false,
  ipProtocol: ec2.IpProtocol.DUAL_STACK,
  subnetConfiguration: [{ subnetType: ec2.SubnetType.PUBLIC, name: 'Public', mapPublicIpOnLaunch: true }],
});
const instance = new ec2.Instance(stack, 'Instance', {
  vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.SMALL),
  machineImage: ec2.MachineImage.latestAmazonLinux2023({ cpuType: ec2.AmazonLinuxCpuType.ARM_64 }),
  init: ec2.CloudFormationInit.fromElements(
    ec2.InitCommand.shellCommand('dnf install nginx -y'),
    ec2.InitCommand.shellCommand('systemctl start nginx'),
  ),
});
instance.connections.allowFrom(ec2.Peer.anyIpv4(), ec2.Port.HTTP);
instance.connections.allowFrom(ec2.Peer.anyIpv6(), ec2.Port.HTTP);

const dns = new ais.ec2.PublicDnsName(stack, 'PublicDnsName', { instance });

const vpcLambda = new ec2.Vpc(stack, 'VpcLambda', {
  natGateways: 0,
  restrictDefaultSecurityGroup: false,
  ipProtocol: ec2.IpProtocol.DUAL_STACK,
  subnetConfiguration: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, name: 'Private' }],
});
const fetcherSG = new ec2.SecurityGroup(stack, 'FetcherSG', {
  vpc: vpcLambda,
  allowAllOutbound: true,
  allowAllIpv6Outbound: true,
});
const fetcher = new lambda.Function(stack, 'Fetcher', {
  code: lambda.Code.fromInline(`\
    exports.handler = async (event) => {
      const res = await fetch(event.url);
      const text = await res.text();
      return { status: res.status };
    }
  `),
  handler: 'index.handler',
  architecture: lambda.Architecture.ARM_64,
  runtime: lambda.Runtime.NODEJS_24_X,
  vpc: vpcLambda,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
  securityGroups: [fetcherSG],
  ipv6AllowedForDualStack: true,
});

const integ = new IntegTest(app, 'integ-test', {
  testCases: [stack],
});
integ.assertions.httpApiCall(`http://${dns.publicIpv4DnsName}/`).expect(ExpectedResult.objectLike({ status: 200 }));
integ.assertions
  .invokeFunction({
    functionName: fetcher.functionName,
    payload: JSON.stringify({ url: `http://${dns.publicIpv6DnsName}/` }),
  })
  .expect(ExpectedResult.objectLike({ Payload: JSON.stringify({ status: 200 }) }));
integ.assertions
  .invokeFunction({
    functionName: fetcher.functionName,
    payload: JSON.stringify({ url: `http://${dns.publicDualStackDnsName}/` }),
  })
  .expect(ExpectedResult.objectLike({ Payload: JSON.stringify({ status: 200 }) }));
