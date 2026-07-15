import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as ais from '../../lib';

describe('ActiveReceiptRuleSet', () => {
  let stack: cdk.Stack;
  beforeEach(() => {
    stack = new cdk.Stack();
  });

  test('defines a custom resource', () => {
    const ruleSet = new ses.ReceiptRuleSet(stack, 'RuleSet');
    new ais.ses.ActiveReceiptRuleSet(stack, 'ActiveReceiptRuleSet', { ruleSet });
    Template.fromStack(stack).hasResourceProperties('Custom::SetActiveReceiptRuleSet', {
      Update: {
        'Fn::Join': ['', Match.arrayWith([Match.stringLikeRegexp('"RuleSetName":'), { Ref: 'RuleSetE30C6C48' }])],
      },
    });
  });
});
