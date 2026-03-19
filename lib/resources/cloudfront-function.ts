import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import type { Construct } from 'constructs';
import { buildSync } from 'esbuild';

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
export class CloudfrontFunction extends cloudfront.Function {
  constructor(scope: Construct, id: string, props: CloudfrontFunctionProps) {
    const { entry, define, ...resProps } = props;
    super(scope, id, {
      code: cloudfront.FunctionCode.fromInline(cdk.Lazy.string({ produce: () => compile(entry, define) })),
      runtime: cloudfront.FunctionRuntime.JS_2_0,
      ...resProps,
    });
  }
}

function compile(entry: string, define?: Record<string, unknown>) {
  const res = buildSync({
    entryPoints: [entry],
    define: Object.fromEntries(
      Object.entries(define ?? {}).map(([key, value]) => [key, JSON.stringify(value ?? null)]),
    ),
    minify: true,
    platform: 'neutral',
    target: 'es5',
    charset: 'utf8',
    write: false,
  });
  return res.outputFiles[0]!.text;
}
