import * as cdk from 'aws-cdk-lib';
export class VirginiaStack extends cdk.Stack {
    static lookup(scope, id) {
        const scopeStack = cdk.Stack.of(scope);
        return scopeStack.node.tryFindChild(id) ?? new this(scopeStack, id);
    }
    constructor(scope, id) {
        super(scope, id, {
            env: { account: scope.account, region: 'us-east-1' },
            crossRegionReferences: true,
        });
        cdk.CrossStackReferences.of(this).consume(cdk.ReferenceStrength.WEAK);
    }
}
//# sourceMappingURL=virginia-stack.js.map