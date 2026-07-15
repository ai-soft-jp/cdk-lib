import { ExpectedResult, IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as cdk from 'aws-cdk-lib';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as ais from '../../lib';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'ActiveReceiptRuleSetIntegTest');

const ruleSet = new ses.ReceiptRuleSet(stack, 'RuleSet');
new ais.ses.ActiveReceiptRuleSet(stack, 'ActiveReceiptRuleSet', { ruleSet });

const integ = new IntegTest(app, 'integ-test', {
  testCases: [stack],
});
integ.assertions.awsApiCall('ses', 'DescribeActiveReceiptRuleSet', {}).expect(
  ExpectedResult.objectLike({
    Metadata: { Name: ruleSet.receiptRuleSetName },
  }),
);
