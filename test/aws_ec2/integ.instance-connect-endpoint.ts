import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ais from '../../lib';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'EICEndpointIntegTest');

const vpc = new ec2.Vpc(stack, 'Vpc', { natGateways: 0, restrictDefaultSecurityGroup: false });
const eic = new ais.ec2.InstanceConnectEndpoint(stack, 'InstanceConnectEndpoint', { vpc });
const sg = new ec2.SecurityGroup(stack, 'SecurityGroup', { vpc });
sg.connections.allowFrom(eic, ec2.Port.tcp(22), 'Allow SSH from EIC');

new IntegTest(app, 'integ-test', {
  testCases: [stack],
});
