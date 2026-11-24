export type Env = {
    readonly SEND_QUOTA_ALARM_NAME: string;
    readonly SEND_RATE_ALARM_NAME: string;
    readonly ALARM_ACTION_ARNS?: string;
    readonly OK_ACTION_ARNS?: string;
};
export declare const handler: import("@aws/durable-execution-sdk-js").DurableLambdaHandler;
