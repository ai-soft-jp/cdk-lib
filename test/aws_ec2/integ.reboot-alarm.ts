import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ais from '../../lib';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'RebootAlarmIntegTest');

const vpc = new ec2.Vpc(stack, 'Vpc', {
  natGateways: 0,
  restrictDefaultSecurityGroup: false,
});
const instance = new ec2.Instance(stack, 'Instance', {
  vpc,
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.SMALL),
  machineImage: ec2.MachineImage.latestAmazonLinux2023({ cpuType: ec2.AmazonLinuxCpuType.ARM_64 }),
});
new ais.ec2.RebootAlarm(stack, 'RebootAlarm', { instance });

new IntegTest(app, 'integ-test', {
  testCases: [stack],
});
