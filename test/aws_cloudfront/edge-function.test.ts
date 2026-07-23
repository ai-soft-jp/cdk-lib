import * as path from 'node:path';
import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ais from '../../lib';

describe('EdgeFunction', () => {
  describe('on us-east-1', () => {
    let stack: cdk.Stack;
    beforeEach(() => {
      stack = new cdk.Stack(undefined, undefined, { env: { region: 'us-east-1' } });
    });

    test('defines a lambda function directly', () => {
      new ais.cloudfront.EdgeFunction(stack, 'Function', {
        entry: path.join(__dirname, 'function/edge.ts'),
      });
      Template.fromStack(stack).hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            { Principal: { Service: 'lambda.amazonaws.com' } },
            { Principal: { Service: 'edgelambda.amazonaws.com' } },
          ],
        },
      });
      Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Function', {
        Architectures: ['x86_64'],
        Runtime: 'nodejs24.x',
        Handler: 'index.handler',
        Environment: Match.absent(),
      });
      Template.fromStack(stack).hasResourceProperties('AWS::Lambda::Version', {
        FunctionName: { Ref: 'EdgeFunctionHandler45772967' },
      });
    });

    test('defines a version cleanup', () => {
      new ais.cloudfront.EdgeFunction(stack, 'Function', {
        entry: path.join(__dirname, 'function/edge.ts'),
      });
      Template.fromStack(stack).hasResourceProperties('Custom::CleanupEdgeFunctions', {
        Lambdas: [{ functionName: {}, version: {} }],
      });
    });
  });

  describe('on ap-northeast-1', () => {
    let app: cdk.App;
    let stack: cdk.Stack;
    beforeEach(() => {
      app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStack', { env: { region: 'ap-northeast-1' }, crossRegionReferences: true });
    });

    test('defines the EdgeFunctions stack in us-east-1', () => {
      new ais.cloudfront.EdgeFunction(stack, 'Function', { entry: path.join(__dirname, 'function/edge.ts') });
      const certificateStack = stack.node.tryFindChild('EdgeFunctions');
      expect(certificateStack).toBeInstanceOf(cdk.Stack);
      expect(cdk.Stack.of(certificateStack!).region).toEqual('us-east-1');
    });

    test('defines a lambda function in the EdgeFunctions stack', () => {
      cdk.Validations.of(stack).acknowledge({ id: 'CloudFormation-Validate::F0001', reason: 'expected' });
      new ais.cloudfront.EdgeFunction(stack, 'Function', { entry: path.join(__dirname, 'function/edge.ts') });
      const edgeStack = stack.node.tryFindChild('EdgeFunctions') as cdk.Stack;
      Template.fromStack(edgeStack).hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            { Principal: { Service: 'lambda.amazonaws.com' } },
            { Principal: { Service: 'edgelambda.amazonaws.com' } },
          ],
        },
      });
      Template.fromStack(edgeStack).hasResourceProperties('AWS::Lambda::Function', {
        Architectures: ['x86_64'],
        Runtime: 'nodejs24.x',
        Handler: 'index.handler',
        Environment: Match.absent(),
      });
      Template.fromStack(edgeStack).hasResourceProperties('AWS::Lambda::Version', {
        FunctionName: { Ref: 'EdgeFunctionc8c1c576f126cdf8046ee92318cc82dc1fafc95df6HandlerC6C936D7' },
      });
    });

    test('consume an EdgeLambda', () => {
      const func = new ais.cloudfront.EdgeFunction(stack, 'Function', {
        entry: path.join(__dirname, 'function/edge.ts'),
      });
      new cloudfront.Distribution(stack, 'Distribution', {
        defaultBehavior: {
          origin: new origins.HttpOrigin('example.com'),
          edgeLambdas: [func.edgeLambda(cloudfront.LambdaEdgeEventType.VIEWER_REQUEST)],
        },
      });
      Template.fromStack(stack).hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            LambdaFunctionAssociations: [
              {
                EventType: 'viewer-request',
                LambdaFunctionARN: { 'Fn::GetStackOutput': { Region: 'us-east-1' } },
              },
            ],
          },
        },
      });
    });

    test('grantPrincipal creates a new policy', () => {
      const func = new ais.cloudfront.EdgeFunction(stack, 'Function', {
        entry: path.join(__dirname, 'function/edge.ts'),
      });
      const bucket = new s3.Bucket(stack, 'Bucket');
      bucket.grantRead(func);

      Template.fromStack(stack).hasResourceProperties('AWS::IAM::Policy', {
        Roles: [{ 'Fn::GetStackOutput': { Region: 'us-east-1' } }],
        PolicyDocument: {
          Statement: [{ Action: Match.arrayWith(['s3:GetObject*']), Effect: 'Allow' }],
        },
      });
    });
  });
});
