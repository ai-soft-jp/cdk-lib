import { ExpectedResult, IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ais from '../../lib';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'NodejsFunctionIntegTest');

const layerArm64 = ais.lambda.ChromiumLayer.of(stack);
const layerX64 = ais.lambda.ChromiumLayer.of(stack, { architecture: lambda.Architecture.X86_64 });

const funcArm64 = new lambda.Function(stack, 'FunctionArm64', {
  code: lambda.Code.fromInline(
    'exports.handler = () => import("@sparticuz/chromium").then((c) => c.default.executablePath());',
  ),
  handler: 'index.handler',
  architecture: lambda.Architecture.ARM_64,
  runtime: lambda.Runtime.NODEJS_24_X,
  layers: [layerArm64],
  memorySize: 512,
  timeout: cdk.Duration.seconds(30),
});
const funcX64 = new lambda.Function(stack, 'FunctionX64', {
  code: lambda.Code.fromInline(
    'exports.handler = () => import("@sparticuz/chromium").then((c) => c.default.executablePath());',
  ),
  handler: 'index.handler',
  architecture: lambda.Architecture.X86_64,
  runtime: lambda.Runtime.NODEJS_24_X,
  layers: [layerX64],
  memorySize: 512,
  timeout: cdk.Duration.seconds(30),
});

const integ = new IntegTest(app, 'integ-test', {
  testCases: [stack],
});
integ.assertions
  .invokeFunction({ functionName: funcArm64.functionName })
  .expect(ExpectedResult.objectLike({ Payload: JSON.stringify('/tmp/chromium') }));
integ.assertions
  .invokeFunction({ functionName: funcX64.functionName })
  .expect(ExpectedResult.objectLike({ Payload: JSON.stringify('/tmp/chromium') }));
