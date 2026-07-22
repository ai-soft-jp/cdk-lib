import * as path from 'node:path';
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as ais from '../../lib';

describe('NodejsFunction', () => {
  let stack: cdk.Stack;
  beforeEach(() => {
    stack = new cdk.Stack();
  });

  test('bundles', () => {
    new ais.lambda.NodejsFunction(stack, 'Function', {
      entry: path.join(__dirname, 'function/integ.ts'),
    });
    Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
      Architectures: ['arm64'],
      Runtime: 'nodejs24.x',
      Handler: 'index.handler',
      Environment: { Variables: { NODE_OPTIONS: '--enable-source-maps' } },
      LoggingConfig: { LogFormat: 'JSON' },
    });
  });
});
