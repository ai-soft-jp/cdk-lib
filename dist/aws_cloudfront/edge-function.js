import * as path from 'node:path';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { NodejsFunction } from '../aws_lambda/nodejs-function.js';
export class EdgeFunction extends Construct {
    body;
    _policy;
    constructor(scope, id, props) {
        super(scope, id);
        const scopeStack = cdk.Stack.of(scope);
        const crossEnv = scopeStack.region !== 'us-east-1';
        const edgeStack = crossEnv ? EdgeFunctionsStack.lookup(scopeStack) : scopeStack;
        const edgeId = crossEnv ? `EdgeFunction-${this.node.addr}` : 'EdgeFunction';
        this.body = new EdgeFunctionBody(edgeStack, edgeId, props);
    }
    get functionVersion() {
        return this.body.handler.currentVersion;
    }
    get role() {
        return this.body.role;
    }
    get grantPrincipal() {
        this._policy ??= new iam.Policy(this, 'Policy', { roles: [this.role] });
        return this._policy.grantPrincipal;
    }
    edgeLambda(eventType) {
        return { eventType, functionVersion: this.functionVersion };
    }
}
class EdgeFunctionBody extends Construct {
    role;
    handler;
    constructor(scope, id, props) {
        super(scope, id);
        const role = new iam.Role(this, 'Role', {
            assumedBy: new iam.CompositePrincipal(new iam.ServicePrincipal('lambda.amazonaws.com'), new iam.ServicePrincipal('edgelambda.amazonaws.com')),
            managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')],
        });
        cdk.CrossStackReferences.of(role).produce(cdk.ReferenceStrength.WEAK);
        const bundling = { ...props.bundling, sourceMap: false };
        if (bundling.nodeModules) {
            bundling.commandHooks ??= {
                beforeInstall: (inputDir, outputDir) => [
                    `cp ${path.resolve(import.meta.dirname, '../../functions/edge/.yarnrc.yml')} ${path.join(outputDir, '.yarnrc.yml')}`,
                ],
                beforeBundling: () => [],
                afterBundling: (inputDir, outputDir) => [`rm -rf ${path.join(outputDir, '.yarn')}`],
            };
        }
        const handler = new NodejsFunction(this, 'Handler', {
            ...props,
            bundling,
            runtime: lambda.Runtime.NODEJS_24_X,
            architecture: lambda.Architecture.X86_64,
            currentVersionOptions: { removalPolicy: cdk.RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE },
            role,
        });
        handler.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE);
        cdk.CrossStackReferences.of(handler).produce(cdk.ReferenceStrength.WEAK);
        cdk.CrossStackReferences.of(handler.currentVersion).produce(cdk.ReferenceStrength.WEAK);
        CleanupEdgeFunctions.of(this).addEdgeFunction(handler);
        this.role = role;
        this.handler = handler;
    }
}
class EdgeFunctionsStack extends cdk.Stack {
    static lookup(scope) {
        return scope.node.tryFindChild('EdgeFunctions') ?? new EdgeFunctionsStack(scope, 'EdgeFunctions');
    }
    constructor(scope, id) {
        super(scope, id, { env: { account: scope.account, region: 'us-east-1' }, crossRegionReferences: true });
        cdk.CrossStackReferences.of(this).consume(cdk.ReferenceStrength.WEAK);
    }
}
class CleanupEdgeFunctions extends Construct {
    functions = [];
    static of(scope) {
        const scopeStack = cdk.Stack.of(scope);
        return (scopeStack.node.tryFindChild('CleanupEdgeFunctions') ??
            new CleanupEdgeFunctions(scopeStack, 'CleanupEdgeFunctions'));
    }
    constructor(scope, id) {
        super(scope, id);
        const handler = new nodejs.NodejsFunction(this, 'Handler', {
            entry: path.resolve(import.meta.dirname, '../../functions/custom-resource/cleanup-lambda-edge-versions.ts'),
            description: `[${this.node.path}] Cleanup Lambda@Edge function versions`,
            timeout: cdk.Duration.minutes(1),
            architecture: lambda.Architecture.ARM_64,
            runtime: lambda.Runtime.NODEJS_24_X,
            loggingFormat: lambda.LoggingFormat.TEXT,
            bundling: {
                format: nodejs.OutputFormat.ESM,
                mainFields: ['module', 'main'],
            },
        });
        handler.addToRolePolicy(new iam.PolicyStatement({
            actions: ['lambda:ListVersionsByFunction', 'lambda:DeleteFunction'],
            resources: cdk.Lazy.list({
                produce: () => this.functions.flatMap(({ functionArn }) => [functionArn, `${functionArn}:*`]),
            }),
        }));
        cdk.RemovalPolicies.of(handler).destroy({ applyToResourceTypes: ['AWS::Logs::LogGroup'] });
        new cdk.CustomResource(this, 'CleanupEdgeFunctions', {
            resourceType: 'Custom::CleanupEdgeFunctions',
            serviceToken: handler.functionArn,
            properties: {
                Lambdas: cdk.Lazy.any({
                    produce: () => this.functions.map(({ functionName, version }) => ({ functionName, version })),
                }),
            },
        });
    }
    addEdgeFunction(handler) {
        this.functions.push({
            functionArn: handler.functionArn,
            functionName: handler.functionName,
            version: handler.currentVersion.version,
        });
    }
}
//# sourceMappingURL=edge-function.js.map