import * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';
export declare class VirginiaStack extends cdk.Stack {
    static lookup(scope: Construct, id: string): cdk.Stack;
    constructor(scope: cdk.Stack, id: string);
}
