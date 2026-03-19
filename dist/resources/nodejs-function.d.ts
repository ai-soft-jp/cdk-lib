import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import type { Construct } from 'constructs';
/**
 * NodejsFunction extension with bundling aws-sdk
 */
export declare class NodejsFunction extends nodejs.NodejsFunction {
    constructor(scope: Construct, id: string, { bundling, ...props }: nodejs.NodejsFunctionProps);
}
