import * as path from 'node:path';
import type * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import type { Construct } from 'constructs';
import { Function } from './function';

export interface SimpleRedirectProps extends Pick<
  cloudfront.FunctionProps,
  'functionName' | 'comment' | 'autoPublish'
> {
  readonly target: string;
  readonly keepPath?: boolean;
  readonly statusCode?: number;
}

export class SimpleRedirect extends Function {
  constructor(scope: Construct, id: string, props: SimpleRedirectProps) {
    super(scope, id, {
      entry: path.resolve(__dirname, '../../functions/cloudfront/simple-redirect.js'),
      define: {
        TARGET: props.target,
        KEEP_PATH: props.keepPath ?? false,
        STATUS_CODE: props.statusCode ?? 301,
      },
      functionName: props.functionName,
      comment: props.comment ?? `[${scope.node.path}] Redirector: ${props.target}`,
      autoPublish: props.autoPublish,
    });
  }
}
