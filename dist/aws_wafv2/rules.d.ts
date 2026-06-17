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
export declare function awsManagedRule(name: string, overrides?: Record<string, wafv2.CfnWebACL.RuleActionProperty>): Omit<wafv2.CfnWebACL.RuleProperty, 'priority'>;
export declare function prioritizeRules(...rules: Omit<wafv2.CfnWebACL.RuleProperty, 'priority'>[]): wafv2.CfnWebACL.RuleProperty[];
export declare function blockLabeledExceptPath(name: string, labels: readonly BlockLabeled[]): Omit<wafv2.CfnWebACL.RuleProperty, 'priority'>;
