import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import type { Construct } from 'constructs';
/**
 * Properties for SesQuotaAlarms
 */
export interface SesQuotaAlarmsProps {
    /**
     * The version
     * @default - Current timestamp
     */
    readonly version?: string;
}
/**
 * Defines alarms for SES rate and quota
 */
export declare class SesQuotaAlarms extends cdk.Resource {
    readonly alarms: cloudwatch.Alarm[];
    constructor(scope: Construct, id: string, props?: SesQuotaAlarmsProps);
    /**
     * Trigger this action if the alarm fires
     */
    addAlarmAction(...actions: cloudwatch.IAlarmAction[]): void;
    /**
     * Trigger this action if the alarm returns from breaching state into ok state
     */
    addOkAction(...actions: cloudwatch.IAlarmAction[]): void;
}
