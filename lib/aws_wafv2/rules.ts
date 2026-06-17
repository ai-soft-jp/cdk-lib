import type * as wafv2 from 'aws-cdk-lib/aws-wafv2';

export interface BlockLabel {
  readonly label: string;
  readonly namespace?: never;
  readonly pathRegexes: readonly string[];
}
export interface BlockNamespace {
  readonly label?: never;
  readonly namespace: string;
  readonly pathRegexes: readonly string[];
}
export type BlockLabeled = BlockLabel | BlockNamespace;

export function awsManagedRule(
  name: string,
  overrides?: Record<string, wafv2.CfnWebACL.RuleActionProperty>,
): Omit<wafv2.CfnWebACL.RuleProperty, 'priority'> {
  const ruleActionOverrides =
    overrides && Object.entries(overrides).map(([name, actionToUse]) => ({ name, actionToUse }));
  return {
    name: `AWS-${name}`,
    statement: { managedRuleGroupStatement: { name, vendorName: 'AWS', ruleActionOverrides } },
    overrideAction: { none: {} },
    visibilityConfig: { cloudWatchMetricsEnabled: true, sampledRequestsEnabled: true, metricName: name },
  };
}

export function prioritizeRules(
  ...rules: Omit<wafv2.CfnWebACL.RuleProperty, 'priority'>[]
): wafv2.CfnWebACL.RuleProperty[] {
  return rules.map((rule, priority) => ({ priority, ...rule }));
}

export function blockLabeledExceptPath(
  name: string,
  labels: readonly BlockLabeled[],
): Omit<wafv2.CfnWebACL.RuleProperty, 'priority'> {
  if (!labels.length) throw new Error('labels is empty');

  const statements = labels.map(
    (label): wafv2.CfnWebACL.StatementProperty => ({
      andStatement: {
        statements: [
          {
            labelMatchStatement: {
              key: label.namespace ?? label.label,
              scope: label.namespace ? 'NAMESPACE' : 'LABEL',
            },
          },
          ...label.pathRegexes.map(
            (regexString): wafv2.CfnWebACL.StatementProperty => ({
              notStatement: {
                statement: {
                  regexMatchStatement: {
                    fieldToMatch: { uriPath: {} },
                    regexString,
                    textTransformations: [{ priority: 0, type: 'NORMALIZE_PATH' }],
                  },
                },
              },
            }),
          ),
        ],
      },
    }),
  );

  return {
    name,
    statement: statements.length === 1 ? statements[0]! : { orStatement: { statements } },
    action: { block: {} },
    visibilityConfig: {
      cloudWatchMetricsEnabled: true,
      metricName: name,
      sampledRequestsEnabled: true,
    },
  };
}
