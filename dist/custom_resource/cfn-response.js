import { promisify } from 'node:util';
const SUCCESS = 'SUCCESS';
const FAILED = 'FAILED';
const sleep = promisify(setTimeout);
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
export class CfnHandler {
    event;
    context;
    /**
     * The Physical Resource Id
     */
    physicalResourceId;
    /**
     * Indicates whether to echo response data
     */
    noEcho;
    /**
     * The lambda handler
     */
    static handler() {
        return async (event, context) => await new this(event, context).handle();
    }
    constructor(event, context) {
        this.event = event;
        this.context = context;
        console.log({ event });
    }
    async handle() {
        try {
            let data;
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
                    }
                    else {
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
        }
        catch (error) {
            console.error(error);
            await failed(this.event, this.context, {
                physicalResourceId: this.physicalResourceId ?? FAILURE_MARKER,
                error,
            });
        }
    }
    get props() {
        const { ServiceToken, ...props } = this.event.ResourceProperties;
        return props;
    }
    get oldProps() {
        if (this.event.RequestType !== 'Update')
            throw new Error(`oldProps is available only on Update`);
        return this.event.OldResourceProperties;
    }
    async handleCreate() {
        return await this.handleUpdate('CreateRequest');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async handleUpdate(physicalResourceId) {
        console.log(`No action defined for RequestType=${this.event.RequestType}`);
        return undefined;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async handleDelete(physicalResourceId) {
        console.log(`No action defined for RequestType=${this.event.RequestType}`);
    }
}
/**
 * Send CloudFormation Success
 */
export async function success(event, context, props) {
    await send(event.ResponseURL, createSuccess(event, context, props));
}
/**
 * Create CloudFormation Success
 */
export function createSuccess(event, context, props) {
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
export async function failed(event, context, props) {
    await send(event.ResponseURL, createFailed(event, context, props));
}
/**
 * Create CloudFormation Failure
 */
export function createFailed(event, context, props) {
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
export async function send(url, response) {
    console.log({ response: filterResponse(response) });
    for (let c = 0;; ++c) {
        try {
            const res = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(response),
            });
            if (!res.ok)
                throw new Error(`${res.status} ${res.statusText}`);
            console.log({ status: `${res.status} ${res.statusText}` });
            return;
        }
        catch (error) {
            if (c >= 5)
                throw error;
            console.error(error);
            await sleep(3000);
        }
    }
}
function filterResponse(response) {
    return { ...response, Data: response.NoEcho ? '<FILTERED>' : response.Data };
}
//# sourceMappingURL=cfn-response.js.map