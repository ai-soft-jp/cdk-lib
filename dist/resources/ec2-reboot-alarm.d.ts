import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import type * as ec2 from 'aws-cdk-lib/aws-ec2';
import type { Construct } from 'constructs';
/**
 * Properties for Ec2RebootAlarm
 */
export interface Ec2RebootAlarmProps {
    /**
     * The EC2 instance
     */
    readonly instance: ec2.IInstanceRef;
    /**
     * The description of the CloudWatch alarm
     * @default - Auto generated
     */
    readonly description?: string;
    /**
     * The evaluation periods of the alarm (in minutes)
     * @default 10
     */
    readonly minutes?: number;
    /**
     * Specify how missing data points are treated during alarm evaluation
     * @default TreatMissingData.MISSING
     */
    readonly treatMissingData?: cloudwatch.TreatMissingData;
}
/**
 * EC2 Reboot action alarm
 */
export declare class Ec2RebootAlarm extends cloudwatch.Alarm {
    constructor(scope: Construct, id: string, props: Ec2RebootAlarmProps);
}
