import * as path from 'node:path';
import { ExpectedResult, IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import * as ais from '../../lib';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'NodejsFunctionIntegTest');

const func = new ais.lambda.NodejsFunction(stack, 'NodejsFunction', {
  entry: path.join(__dirname, 'function/integ.ts'),
});

const integ = new IntegTest(app, 'integ-test', {
  testCases: [stack],
});
integ.assertions
  .invokeFunction({ functionName: func.functionName })
  .expect(
    ExpectedResult.objectLike({
      Payload: JSON.stringify({
        account: cdk.Aws.ACCOUNT_ID,
        __filename: '/var/task/index.mjs',
        __dirname: '/var/task',
      }),
    }),
  );
