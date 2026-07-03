import * as cdk from 'aws-cdk-lib';
import type * as ses from 'aws-cdk-lib/aws-ses';
import * as cr from 'aws-cdk-lib/custom-resources';
import type { Construct } from 'constructs';

export interface ActiveReceiptRuleSetProps {
  readonly ruleSet: ses.IReceiptRuleSetRef;
}

export class ActiveReceiptRuleSet extends cr.AwsCustomResource {
  constructor(scope: Construct, id: string, props: ActiveReceiptRuleSetProps) {
    super(scope, id, {
      resourceType: 'Custom::SetActiveReceiptRuleSet',
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({ resources: ['*'] }),
      onUpdate: {
        service: 'ses',
        action: 'setActiveReceiptRuleSet',
        parameters: { RuleSetName: props.ruleSet.receiptRuleSetRef.ruleSetName },
        physicalResourceId: cr.PhysicalResourceId.of(props.ruleSet.receiptRuleSetRef.ruleSetName),
      },
      onDelete: {
        service: 'ses',
        action: 'setActiveReceiptRuleSet',
        parameters: {},
      },
      serviceTimeout: cdk.Duration.minutes(1),
    });
  }
}
