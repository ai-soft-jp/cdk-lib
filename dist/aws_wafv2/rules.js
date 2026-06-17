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
export function blockLabeledExceptPath(name, labels) {
    if (!labels.length)
        throw new Error('labels is empty');
    const statements = labels.map((label) => ({
        andStatement: {
            statements: [
                {
                    labelMatchStatement: {
                        key: label.namespace ?? label.label,
                        scope: label.namespace ? 'NAMESPACE' : 'LABEL',
                    },
                },
                ...label.pathRegexes.map((regexString) => ({
                    notStatement: {
                        statement: {
                            regexMatchStatement: {
                                fieldToMatch: { uriPath: {} },
                                regexString,
                                textTransformations: [{ priority: 0, type: 'NORMALIZE_PATH' }],
                            },
                        },
                    },
                })),
            ],
        },
    }));
    return {
        name,
        statement: statements.length === 1 ? statements[0] : { orStatement: { statements } },
        action: { block: {} },
        visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: name,
            sampledRequestsEnabled: true,
        },
    };
}
//# sourceMappingURL=rules.js.map