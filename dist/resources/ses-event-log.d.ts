import { Resource } from 'aws-cdk-lib';
import type * as logs from 'aws-cdk-lib/aws-logs';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as sns from 'aws-cdk-lib/aws-sns';
import type { Construct } from 'constructs';
/**
 * Properties for SesEventLog
 */
export interface SesEventLogProps {
    /**
     * The configuration set
     */
    readonly configurationSet: ses.IConfigurationSetRef;
    /**
     * The SES events to log
     * @default - Send, Delivery, DeliveryDelay, Bounce, Complaint, Reject, RenderingFailure
     */
    readonly events?: ses.EmailSendingEvent[];
    /**
     * The log group
     * @default - Automatically created
     */
    readonly logGroup?: logs.ILogGroupRef;
}
/**
 * Creates a SES event destination which logs SES events
 */
export declare class SesEventLog extends Resource {
    /**
     * The SNS topic
     */
    readonly topic: sns.Topic;
    constructor(scope: Construct, id: string, props: SesEventLogProps);
}
