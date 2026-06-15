import * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';

interface VirginiaStackProps {
  readonly crossStackReferehceStrength?: cdk.ReferenceStrength;
}

export class VirginiaStack extends cdk.Stack {
  static lookup(scope: Construct, id: string, props?: VirginiaStackProps): cdk.Stack {
    const scopeStack = cdk.Stack.of(scope);
    let stack = scopeStack.node.tryFindChild(id) as cdk.Stack;
    if (!stack) {
      stack = new this(scopeStack, id);
      cdk.CrossStackReferences.of(stack).consume(props?.crossStackReferehceStrength ?? cdk.ReferenceStrength.WEAK);
    }
    return stack;
  }

  constructor(scope: cdk.Stack, id: string) {
    super(scope, id, {
      env: { account: scope.account, region: 'us-east-1' },
      crossRegionReferences: true,
    });
  }
}
