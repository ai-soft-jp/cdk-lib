import * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';

export class VirginiaStack extends cdk.Stack {
  static lookup(scope: Construct, id: string): cdk.Stack {
    const scopeStack = cdk.Stack.of(scope);
    return (scopeStack.node.tryFindChild(id) as cdk.Stack) ?? new this(scopeStack, id);
  }

  constructor(scope: cdk.Stack, id: string) {
    super(scope, id, {
      env: { account: scope.account, region: 'us-east-1' },
      crossRegionReferences: true,
    });
    cdk.CrossStackReferences.of(this).consume(cdk.ReferenceStrength.WEAK);
  }
}
