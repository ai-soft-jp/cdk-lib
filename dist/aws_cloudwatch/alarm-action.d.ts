import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import type { IConstruct } from 'constructs';
/**
 * Properties for AlarmActions aspect application
 */
export interface AlarmActionProps {
    /**
     * Priority to apply aspect
     * @default AspectPriority.MUTATING
     */
    readonly priority?: number;
    /**
     * CloudWatch alarm actions to be added to target alarms
     */
    readonly actions: cloudwatch.IAlarmAction[];
}
/**
 * CloudWatch alarm event type
 */
export declare enum AlarmEventType {
    /** OK */
    Ok = "Ok",
    /** ALARM */
    Alarm = "Alarm",
    /** INSUFFICIENT_DATA */
    InsufficientData = "InsufficientData"
}
/**
 * Applies alarm actions to descending CloudWatch alarms
 */
export declare class AlarmActions {
    private readonly scope;
    /**
     * Returns AlarmActions aspect of the specified node
     */
    static of(scope: IConstruct): AlarmActions;
    private constructor();
    /**
     * Applies alarm actions
     * @param eventTypes The alarm event types
     */
    apply(eventTypes: AlarmEventType[], props: AlarmActionProps): void;
    /**
     * Applies OK action
     */
    ok(props: AlarmActionProps): void;
    /**
     * Applies ALARM action
     */
    alarm(props: AlarmActionProps): void;
    /**
     * Applies INSUFFICIENT_DATA action
     */
    insufficientData(props: AlarmActionProps): void;
}
