import { promisify } from 'node:util';
import type * as lambda from 'aws-lambda';

const SUCCESS = 'SUCCESS';
const FAILED = 'FAILED';
const sleep = promisify(setTimeout);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObject = Record<string, any>;

const FAILURE_MARKER = 'CfnHandler::RESOURCE_FAILURE_MARKER';

/**
 * CloudFormation Custom Resource Handler Helper
 *
 * ### Usage
 * ``` ts
 * class MyHandler extends CfnHandler<ResourceProps, ResponseData> {
 *   handleCreate() { ... }
 *   handleUpdate() { ... }
 *   handleDelete() { ... }
 * }
 * export const handler = MyHandler.handler();
 */
export abstract class CfnHandler<
  TProps extends AnyObject | never = never,
  TData extends AnyObject | undefined | void = void,
> {
  /**
   * The Physical Resource Id
   */
  physicalResourceId: string | undefined;
  /**
   * Indicates whether to echo response data
   */
  noEcho: boolean | undefined;

  /**
   * The lambda handler
   */
  static handler<TProps extends AnyObject | never, TData extends AnyObject | undefined | void>(
    this: new (event: lambda.CloudFormationCustomResourceEvent, context: lambda.Context) => CfnHandler<TProps, TData>,
  ): lambda.CloudFormationCustomResourceHandler {
    return async (event, context) => await new this(event, context).handle();
  }

  constructor(
    readonly event: lambda.CloudFormationCustomResourceEvent,
    readonly context: lambda.Context,
  ) {
    console.log({ event });
  }

  async handle(): Promise<void> {
    try {
      let data: TData;
      switch (this.event.RequestType) {
        case 'Create':
          data = await this.handleCreate();
          break;
        case 'Update':
          this.physicalResourceId ??= this.event.PhysicalResourceId;
          data = await this.handleUpdate(this.event.PhysicalResourceId);
          break;
        case 'Delete':
          this.physicalResourceId = this.event.PhysicalResourceId;
          if (this.physicalResourceId === FAILURE_MARKER) {
            console.warn('Resource has failed to create; skipping deletion.');
          } else {
            await this.handleDelete(this.event.PhysicalResourceId);
          }
          break;
        default:
          // @ts-expect-error dereferencing never
          throw new Error(`Unexpected request type: ${this.event.RequestType}`);
      }
      if (!this.physicalResourceId) {
        throw new Error('Missing physicalResourceId');
      }
      await success(this.event, this.context, {
        data: data ?? undefined,
        physicalResourceId: this.physicalResourceId,
        noEcho: this.noEcho,
      });
    } catch (error) {
      console.error(error);
      await failed(this.event, this.context, {
        physicalResourceId: this.physicalResourceId ?? FAILURE_MARKER,
        error,
      });
    }
  }

  get props(): TProps {
    const { ServiceToken, ...props } = this.event.ResourceProperties;
    return props as TProps;
  }

  get oldProps(): TProps {
    if (this.event.RequestType !== 'Update') throw new Error(`oldProps is available only on Update`);
    return this.event.OldResourceProperties as unknown as TProps;
  }

  async handleCreate(): Promise<TData> {
    return await this.handleUpdate('CreateRequest');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handleUpdate(physicalResourceId: string): Promise<TData> {
    console.log(`No action defined for RequestType=${this.event.RequestType}`);
    return undefined as TData;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handleDelete(physicalResourceId: string): Promise<void> {
    console.log(`No action defined for RequestType=${this.event.RequestType}`);
  }
}

/**
 * CustomResource Success
 */
export interface SuccessProps {
  readonly data?: lambda.CloudFormationCustomResourceResponse['Data'];
  readonly physicalResourceId?: string;
  readonly noEcho?: boolean;
}

/**
 * CustomResource Failure
 */
export interface FailedProps {
  readonly physicalResourceId?: string;
  readonly error?: unknown;
}

/**
 * Send CloudFormation Success
 */
export async function success(
  event: lambda.CloudFormationCustomResourceEvent,
  context: lambda.Context,
  props?: SuccessProps,
): Promise<void> {
  await send(event.ResponseURL, createSuccess(event, context, props));
}

/**
 * Create CloudFormation Success
 */
export function createSuccess(
  event: lambda.CloudFormationCustomResourceEvent,
  context: lambda.Context,
  props?: SuccessProps,
): lambda.CloudFormationCustomResourceResponse {
  return {
    Status: SUCCESS,
    PhysicalResourceId: props?.physicalResourceId || context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    NoEcho: props?.noEcho || false,
    Data: props?.data,
  };
}

/**
 * Send CloudFormation Failure
 */
export async function failed(
  event: lambda.CloudFormationCustomResourceEvent,
  context: lambda.Context,
  props?: FailedProps,
): Promise<void> {
  await send(event.ResponseURL, createFailed(event, context, props));
}

/**
 * Create CloudFormation Failure
 */
export function createFailed(
  event: lambda.CloudFormationCustomResourceEvent,
  context: lambda.Context,
  props?: FailedProps,
): lambda.CloudFormationCustomResourceResponse {
  let reason = props?.error ? `${props.error} - ` : '';
  reason += `See the details in CloudWatch Log Stream: ${context.logStreamName}`;
  return {
    Status: FAILED,
    Reason: reason,
    PhysicalResourceId: props?.physicalResourceId || FAILURE_MARKER,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
  };
}

/**
 * Send CloudFormation Response
 */
export async function send(url: string, response: lambda.CloudFormationCustomResourceResponse) {
  console.log({ response: filterResponse(response) });

  for (let c = 0; ; ++c) {
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      console.log({ status: `${res.status} ${res.statusText}` });
      return;
    } catch (error) {
      if (c >= 5) throw error;
      console.error(error);
      await sleep(3000);
    }
  }
}

function filterResponse(response: lambda.CloudFormationCustomResourceResponse) {
  return { ...response, Data: response.NoEcho ? '<FILTERED>' : response.Data };
}
