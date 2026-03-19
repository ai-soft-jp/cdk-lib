import type * as lambda from 'aws-lambda';
type AnyObject = Record<string, any>;
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
export declare abstract class CfnHandler<TProps extends AnyObject | never = never, TData extends AnyObject | undefined | void = void> {
    readonly event: lambda.CloudFormationCustomResourceEvent;
    readonly context: lambda.Context;
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
    static handler<TProps extends AnyObject | never, TData extends AnyObject | undefined | void>(this: new (event: lambda.CloudFormationCustomResourceEvent, context: lambda.Context) => CfnHandler<TProps, TData>): lambda.CloudFormationCustomResourceHandler;
    constructor(event: lambda.CloudFormationCustomResourceEvent, context: lambda.Context);
    handle(): Promise<void>;
    get props(): TProps;
    get oldProps(): TProps;
    handleCreate(): Promise<TData>;
    handleUpdate(physicalResourceId: string): Promise<TData>;
    handleDelete(physicalResourceId: string): Promise<void>;
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
export declare function success(event: lambda.CloudFormationCustomResourceEvent, context: lambda.Context, props?: SuccessProps): Promise<void>;
/**
 * Create CloudFormation Success
 */
export declare function createSuccess(event: lambda.CloudFormationCustomResourceEvent, context: lambda.Context, props?: SuccessProps): lambda.CloudFormationCustomResourceResponse;
/**
 * Send CloudFormation Failure
 */
export declare function failed(event: lambda.CloudFormationCustomResourceEvent, context: lambda.Context, props?: FailedProps): Promise<void>;
/**
 * Create CloudFormation Failure
 */
export declare function createFailed(event: lambda.CloudFormationCustomResourceEvent, context: lambda.Context, props?: FailedProps): lambda.CloudFormationCustomResourceResponse;
/**
 * Send CloudFormation Response
 */
export declare function send(url: string, response: lambda.CloudFormationCustomResourceResponse): Promise<void>;
export {};
