import type * as wafv2 from 'aws-cdk-lib/aws-wafv2';
export declare function awsManagedRule(name: string, overrides?: Record<string, wafv2.CfnWebACL.RuleActionProperty>): Omit<wafv2.CfnWebACL.RuleProperty, 'priority'>;
export declare function prioritizeRules(...rules: Omit<wafv2.CfnWebACL.RuleProperty, 'priority'>[]): wafv2.CfnWebACL.RuleProperty[];
export declare function blockCommonRulesBody(pathRegex: string): Omit<wafv2.CfnWebACL.RuleProperty, 'priority'>;
