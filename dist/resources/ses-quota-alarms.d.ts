import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import type { Construct } from 'constructs';
export interface SesQuotaAlarmsProps {
    readonly version?: string;
}
export declare class SesQuotaAlarms extends cdk.Resource {
    readonly alarms: cloudwatch.Alarm[];
    constructor(scope: Construct, id: string, props?: SesQuotaAlarmsProps);
    addAlarmAction(...actions: cloudwatch.IAlarmAction[]): void;
    addOkAction(...actions: cloudwatch.IAlarmAction[]): void;
}
