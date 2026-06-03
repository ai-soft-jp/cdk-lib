import * as cdk from 'aws-cdk-lib';
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
export enum AlarmEventType {
  /** OK */
  Ok = 'Ok',
  /** ALARM */
  Alarm = 'Alarm',
  /** INSUFFICIENT_DATA */
  InsufficientData = 'InsufficientData',
}

/**
 * Applies alarm actions to descending CloudWatch alarms
 */
export class AlarmActions {
  /**
   * Returns AlarmActions aspect of the specified node
   */
  public static of(scope: IConstruct) {
    return new AlarmActions(scope);
  }

  private constructor(private readonly scope: IConstruct) {}

  /**
   * Applies alarm actions
   * @param eventTypes The alarm event types
   */
  public apply(eventTypes: AlarmEventType[], props: AlarmActionProps) {
    cdk.Aspects.of(this.scope).add(new AlarmActionAspect(eventTypes, props), {
      priority: props.priority ?? cdk.AspectPriority.MUTATING,
    });
  }

  /**
   * Applies OK action
   */
  public ok(props: AlarmActionProps) {
    this.apply([AlarmEventType.Ok], props);
  }

  /**
   * Applies ALARM action
   */
  public alarm(props: AlarmActionProps) {
    this.apply([AlarmEventType.Alarm], props);
  }

  /**
   * Applies INSUFFICIENT_DATA action
   */
  public insufficientData(props: AlarmActionProps) {
    this.apply([AlarmEventType.InsufficientData], props);
  }
}

class AlarmActionAspect implements cdk.IAspect {
  constructor(
    protected readonly eventTypes: AlarmEventType[],
    protected readonly props: AlarmActionProps,
  ) {}

  public visit(node: IConstruct) {
    if (!isAlarm(node)) return;
    for (const eventType of this.eventTypes) {
      node[`add${eventType}Action`](...this.props.actions);
    }
  }
}

function isAlarm(node: IConstruct): node is cloudwatch.Alarm {
  return (
    cdk.Resource.isResource(node) &&
    Object.getPrototypeOf(node).constructor?.PROPERTY_INJECTION_ID === cloudwatch.Alarm.PROPERTY_INJECTION_ID
  );
}
