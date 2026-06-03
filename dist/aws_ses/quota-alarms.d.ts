import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';
/**
 * Properties for QuotaAlarms
 */
export interface QuotaAlarmsProps {
    /**
     * The version
     * @default - Current timestamp
     */
    readonly version?: string;
}
/**
 * Defines alarms for SES rate and quota
 */
export declare class QuotaAlarms extends Construct {
    readonly alarms: cloudwatch.Alarm[];
    constructor(scope: Construct, id: string, props?: QuotaAlarmsProps);
    /**
     * Trigger this action if the alarm fires
     */
    addAlarmAction(...actions: cloudwatch.IAlarmAction[]): void;
    /**
     * Trigger this action if the alarm returns from breaching state into ok state
     */
    addOkAction(...actions: cloudwatch.IAlarmAction[]): void;
}
