import type * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

export type CloudFrontFunction = (
  event: AWSCloudFrontFunction.Event,
) => AWSCloudFrontFunction.Request | AWSCloudFrontFunction.Response;
export type AsyncCloudFrontFunction = (
  event: AWSCloudFrontFunction.Event,
) => Promise<AWSCloudFrontFunction.Request | AWSCloudFrontFunction.Response>;

export interface EventOptions {
  readonly path?: string;
  readonly ip?: string;
  readonly auth?: string;
}

export function getHandler(stack: cdk.Stack, logicalId: RegExp): CloudFrontFunction {
  const res = Template.fromStack(stack).findResources('AWS::CloudFront::Function');
  const code = Object.entries(res).find(([id]) => logicalId.test(id))![1].Properties.FunctionCode;
  return new Function(`'use strict'\n${code}\nreturn handler;`)();
}

export async function getHandlerAsync(
  stack: cdk.Stack,
  logicalId: RegExp,
  kvs: Record<string, string>,
): Promise<AsyncCloudFrontFunction> {
  const res = Template.fromStack(stack).findResources('AWS::CloudFront::Function');
  let code = Object.entries(res).find(([id]) => logicalId.test(id))![1].Properties.FunctionCode;
  code = code.replace(/^import (\w+) from "cloudfront"/gm, (_: string, a: string) => `var ${a} = __mock_cloudfront`);
  return await new Function('__mock_cloudfront', `'use strict'\n${code}\nreturn handler;`)({
    kvs: () => ({
      get: (key: string) =>
        kvs[key] != null ? Promise.resolve(kvs[key]) : Promise.reject(new Error(`NoSuchKey: ${key}`)),
      exists: async (key: string) => Promise.resolve(kvs[key] != null),
    }),
  });
}

export function event(options: EventOptions): AWSCloudFrontFunction.Event {
  const url = new URL(options?.path ?? '/', 'http://localhost');
  return {
    version: '1.0',
    context: {
      distributionDomainName: 'd123.cloudfront.net',
      distributionId: 'E1234567890',
      eventType: 'viewer-request',
      requestId: '12345678',
    },
    viewer: { ip: options?.ip ?? '127.0.0.1' },
    request: {
      method: 'GET',
      uri: url.pathname,
      querystring: Object.fromEntries(url.searchParams.entries().map(([name, value]) => [name, { value }])),
      headers: options?.auth
        ? { authorization: { value: `Basic ${Buffer.from(options.auth).toString('base64')}` } }
        : {},
      cookies: {},
      rawQueryString: () => (url.search ? url.search.slice(1) : undefined),
    },
    response: {
      statusCode: 200,
    },
  };
}
