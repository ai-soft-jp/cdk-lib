import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import type { Construct } from 'constructs';
/**
 * Properties for CloudfrontFunction
 */
export interface CloudfrontFunctionProps extends Omit<cloudfront.FunctionProps, 'code'> {
    /**
     * The path for entry script
     */
    readonly entry: string;
    /**
     * The replacement definitions
     * @default - No definitions
     */
    readonly define?: Record<string, unknown>;
    /**
     * The runtime environment for the function.
     * @default FunctionRuntime.JS_2_0
     */
    readonly runtime?: cloudfront.FunctionRuntime;
}
/**
 * CloudFront Function with esbuild bundling
 */
export declare class CloudfrontFunction extends cloudfront.Function {
    constructor(scope: Construct, id: string, props: CloudfrontFunctionProps);
}
