import * as cdk from 'aws-cdk-lib';
export class VirginiaStack extends cdk.Stack {
    static lookup(scope, id, props) {
        const scopeStack = cdk.Stack.of(scope);
        let stack = scopeStack.node.tryFindChild(id);
        if (!stack) {
            stack = new this(scopeStack, id);
            cdk.CrossStackReferences.of(stack).consume(props?.crossStackReferehceStrength ?? cdk.ReferenceStrength.WEAK);
        }
        return stack;
    }
    constructor(scope, id) {
        super(scope, id, {
            env: { account: scope.account, region: 'us-east-1' },
            crossRegionReferences: true,
        });
    }
}
//# sourceMappingURL=virginia-stack.js.map