export function awsManagedRule(name, overrides) {
    const ruleActionOverrides = overrides && Object.entries(overrides).map(([name, actionToUse]) => ({ name, actionToUse }));
    return {
        name: `AWS-${name}`,
        statement: { managedRuleGroupStatement: { name, vendorName: 'AWS', ruleActionOverrides } },
        overrideAction: { none: {} },
        visibilityConfig: { cloudWatchMetricsEnabled: true, sampledRequestsEnabled: true, metricName: name },
    };
}
export function prioritizeRules(...rules) {
    return rules.map((rule, priority) => ({ priority, ...rule }));
}
export function blockCommonRulesBody(pathRegex) {
    return {
        name: 'BlockCommonRulesBody',
        statement: {
            andStatement: {
                statements: [
                    {
                        labelMatchStatement: {
                            key: 'awswaf:managed:aws:core-rule-set:',
                            scope: 'NAMESPACE',
                        },
                    },
                    {
                        notStatement: {
                            statement: {
                                regexMatchStatement: {
                                    fieldToMatch: { uriPath: {} },
                                    regexString: pathRegex,
                                    textTransformations: [{ priority: 0, type: 'NORMALIZE_PATH' }],
                                },
                            },
                        },
                    },
                ],
            },
        },
        action: { block: {} },
        visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'BlockCommonRulesBody',
            sampledRequestsEnabled: true,
        },
    };
}
//# sourceMappingURL=rules.js.map