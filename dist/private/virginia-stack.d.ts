import * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';
interface VirginiaStackProps {
    readonly crossStackReferehceStrength?: cdk.ReferenceStrength;
}
export declare class VirginiaStack extends cdk.Stack {
    static lookup(scope: Construct, id: string, props?: VirginiaStackProps): cdk.Stack;
    constructor(scope: cdk.Stack, id: string);
}
export {};
