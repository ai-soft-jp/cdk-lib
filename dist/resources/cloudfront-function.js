import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { buildSync } from 'esbuild';
/**
 * CloudFront Function with esbuild bundling
 */
export class CloudfrontFunction extends cloudfront.Function {
    constructor(scope, id, props) {
        const { entry, define, ...resProps } = props;
        super(scope, id, {
            code: cloudfront.FunctionCode.fromInline(cdk.Lazy.string({ produce: () => compile(entry, define) })),
            runtime: cloudfront.FunctionRuntime.JS_2_0,
            ...resProps,
        });
    }
}
function compile(entry, define) {
    const res = buildSync({
        entryPoints: [entry],
        define: Object.fromEntries(Object.entries(define ?? {}).map(([key, value]) => [key, JSON.stringify(value ?? null)])),
        minify: true,
        platform: 'neutral',
        target: 'es5',
        charset: 'utf8',
        write: false,
    });
    return res.outputFiles[0].text;
}
//# sourceMappingURL=cloudfront-function.js.map