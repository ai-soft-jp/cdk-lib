import * as path from 'node:path';
import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import type { Construct } from 'constructs';
import { Function } from './function';

export interface MappedRedirectProps extends Pick<
  cloudfront.FunctionProps,
  'functionName' | 'comment' | 'autoPublish'
> {
  readonly fallback: string;
  readonly prefixTargets?: Record<string, string>;
  readonly statusCode?: number;
  readonly keyValueStoreName?: string;
  readonly keyValueStoreComment?: string;
  readonly source?: cloudfront.ImportSource;
}

export class MappedRedirect extends cdk.Resource implements cloudfront.IFunction {
  readonly keyValueStore: cloudfront.KeyValueStore;
  readonly functionRef: cloudfront.FunctionReference;
  readonly functionArn: string;
  readonly functionName: string;

  constructor(scope: Construct, id: string, props: MappedRedirectProps) {
    super(scope, id);

    const keyValueStore = new cloudfront.KeyValueStore(this, 'KeyValueStore', {
      keyValueStoreName: props.keyValueStoreName,
      comment: props.keyValueStoreComment ?? `[${this.node.path}] Redirection mapping`,
      source: props.source,
    });

    const resource = new Function(this, 'Resource', {
      entry: path.resolve(__dirname, '../../functions/cloudfront/mapped-redirect.js'),
      define: {
        FALLBACK_TARGET: props.fallback,
        PREFIX_TARGETS: props.prefixTargets ? Object.entries(props.prefixTargets) : null,
        STATUS_CODE: props.statusCode ?? 301,
      },
      keyValueStore,
      functionName: props.functionName,
      comment: props.comment ?? `[${this.node.path}] Mapped Redirector`,
      autoPublish: props.autoPublish,
    });

    this.keyValueStore = keyValueStore;
    this.functionRef = resource.functionRef;
    this.functionArn = resource.functionArn;
    this.functionName = resource.functionName;
  }
}
