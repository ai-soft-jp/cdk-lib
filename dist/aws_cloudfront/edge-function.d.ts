import * as cdk from 'aws-cdk-lib';
import type * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
export declare class EdgeFunction extends Construct implements iam.IGrantable {
    private readonly body;
    private _policy?;
    constructor(scope: Construct, id: string, props: nodejs.NodejsFunctionProps);
    get functionVersion(): cdk.aws_lambda.Version;
    get role(): cdk.aws_iam.Role;
    get grantPrincipal(): cdk.aws_iam.IPrincipal;
    edgeLambda(eventType: cloudfront.LambdaEdgeEventType): cloudfront.EdgeLambda;
}
