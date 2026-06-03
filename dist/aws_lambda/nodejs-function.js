import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
const CJS_PROLOGUE = "const require = (await import('node:module')).createRequire(import.meta.url);const __filename = (await import('node:url')).fileURLToPath(import.meta.url);const __dirname = (await import('node:path')).dirname(__filename);";
const DEFAULT_EXTERNAL_MODULES = [
    '@aws-sdk/credential-provider-cognito-identity',
    '@aws-sdk/credential-provider-http',
    '@aws-sdk/credential-provider-ini',
    '@aws-sdk/credential-provider-process',
    '@aws-sdk/credential-provider-sso',
    '@aws-sdk/credential-provider-web-identity',
    '@smithy/credential-provider-imds',
];
/**
 * NodejsFunction extension with bundling aws-sdk
 */
export class NodejsFunction extends nodejs.NodejsFunction {
    constructor(scope, id, { bundling, ...props }) {
        super(scope, id, {
            architecture: lambda.Architecture.ARM_64,
            runtime: lambda.Runtime.NODEJS_24_X,
            loggingFormat: lambda.LoggingFormat.JSON,
            bundling: {
                charset: nodejs.Charset.UTF8,
                format: nodejs.OutputFormat.ESM,
                mainFields: ['module', 'main'],
                sourceMap: true,
                ...bundling,
                banner: `/* NodejsFunction ${props.entry} */ ${bundling?.banner ?? ''} ${CJS_PROLOGUE}`,
                externalModules: [...(bundling?.externalModules ?? []), ...DEFAULT_EXTERNAL_MODULES],
            },
            ...props,
        });
        if (bundling?.sourceMap ?? true) {
            this.addEnvironment('NODE_OPTIONS', '--enable-source-maps', { removeInEdge: true });
        }
    }
}
//# sourceMappingURL=nodejs-function.js.map