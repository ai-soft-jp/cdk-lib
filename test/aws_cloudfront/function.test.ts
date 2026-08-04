import * as path from 'node:path';
import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as ais from '../../lib';

describe('Function', () => {
  let stack: cdk.Stack;
  beforeEach(() => {
    stack = new cdk.Stack();
  });

  test('js', () => {
    new ais.cloudfront.Function(stack, 'Function', {
      entry: path.join(__dirname, 'function/func.js'),
    });
    Template.fromStack(stack).hasResourceProperties('AWS::CloudFront::Function', {
      FunctionCode: Match.stringLikeRegexp('^function handler\\('),
    });
  });

  test('js with define', () => {
    new ais.cloudfront.Function(stack, 'Function', {
      entry: path.join(__dirname, 'function/func.js'),
      define: { VALUE: 'blah blah' },
    });
    Template.fromStack(stack).hasResourceProperties('AWS::CloudFront::Function', {
      FunctionCode: Match.stringLikeRegexp('\\{ value: "blah blah" \\}'),
    });
  });

  test('ts', () => {
    new ais.cloudfront.Function(stack, 'Function', {
      entry: path.join(__dirname, 'function/func.ts'),
    });
    Template.fromStack(stack).hasResourceProperties('AWS::CloudFront::Function', {
      FunctionCode: Match.stringLikeRegexp('^function handler\\('),
    });
  });

  test('ts with define', () => {
    new ais.cloudfront.Function(stack, 'Function', {
      entry: path.join(__dirname, 'function/func.ts'),
      define: { VALUE: 'blah blah' },
    });
    Template.fromStack(stack).hasResourceProperties('AWS::CloudFront::Function', {
      FunctionCode: Match.stringLikeRegexp('\\{ value: "blah blah" \\}'),
    });
  });

  test('complex ts keeps import and require', () => {
    new ais.cloudfront.Function(stack, 'Function', {
      entry: path.join(__dirname, 'function/complex.ts'),
    });
    Template.fromStack(stack).hasResourceProperties('AWS::CloudFront::Function', {
      FunctionCode: Match.stringLikeRegexp(
        '^import cf from "cloudfront";\n' +
          'const crypto = require\\("crypto"\\);\n' +
          'const querystring = require\\("querystring"\\);',
      ),
    });
  });

  test('functionAssociation', () => {
    const func = new ais.cloudfront.Function(stack, 'Function', {
      entry: path.join(__dirname, 'function/func.js'),
    });
    expect(func.functionAssociation(cloudfront.FunctionEventType.VIEWER_REQUEST)).toEqual({
      eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
      function: func,
    });
  });

  test('serialization', () => {
    new ais.cloudfront.Function(stack, 'Function1', {
      comment: 'Function1',
      entry: path.join(__dirname, 'function/func.js'),
    });
    new ais.cloudfront.Function(stack, 'Function2', {
      comment: 'Function2',
      entry: path.join(__dirname, 'function/func.js'),
    });
    new ais.cloudfront.Function(stack, 'Function3', {
      comment: 'Function3',
      entry: path.join(__dirname, 'function/func.js'),
    });
    Template.fromStack(stack).hasResource('AWS::CloudFront::Function', {
      Properties: { FunctionConfig: { Comment: 'Function1' } },
      DependsOn: Match.absent(),
    });
    Template.fromStack(stack).hasResource('AWS::CloudFront::Function', {
      Properties: { FunctionConfig: { Comment: 'Function2' } },
      DependsOn: ['Function1904AA941'],
    });
    Template.fromStack(stack).hasResource('AWS::CloudFront::Function', {
      Properties: { FunctionConfig: { Comment: 'Function3' } },
      DependsOn: ['Function28EA0674A'],
    });
  });
});
