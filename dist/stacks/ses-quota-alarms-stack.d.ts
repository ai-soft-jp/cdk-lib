import * as cdk from 'aws-cdk-lib';
import * as scheduler from 'aws-cdk-lib/aws-scheduler';
import type { Construct } from 'constructs';
import { SesQuotaAlarms } from '../resources/ses-quota-alarms.js';
/**
 * Properties for SesQuotaAlarmsStack
 */
export interface SesQuotaAlarmsStackProps extends cdk.StackProps {
    /**
     * The schedule to check quota
     * @default - Weekly
     */
    readonly schedule?: scheduler.ScheduleExpression;
    /**
     * A time window during which EventBridge Scheduler invokes the schedule.
     * @default TimeWindow.off()
     */
    readonly timeWindow?: scheduler.TimeWindow;
    /**
     * Indicates whether the schedule is enabled.
     * @default true
     */
    readonly enabled?: boolean;
}
/**
 * Defines self-update alarms for SES rate and quota
 */
export declare class SesQuotaAlarmsStack extends cdk.Stack {
    /**
     * The alarms
     */
    readonly alarms: SesQuotaAlarms;
    constructor(scope: Construct, id: string, props?: SesQuotaAlarmsStackProps);
}
