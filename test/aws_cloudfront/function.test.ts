import * as path from 'node:path';
import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
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
});
