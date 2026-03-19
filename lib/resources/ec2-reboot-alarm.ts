import { Duration } from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
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
export class Ec2RebootAlarm extends cloudwatch.Alarm {
  constructor(scope: Construct, id: string, props: Ec2RebootAlarmProps) {
    const minutes = props.minutes ?? 10;
    super(scope, id, {
      alarmDescription:
        props.description ?? `[${scope.node.path}] Auto Reboot: StatusCheckFailed for ${minutes} minutes`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'StatusCheckFailed',
        dimensionsMap: { InstanceId: props.instance.instanceRef.instanceId },
        statistic: cloudwatch.Stats.MAXIMUM,
        period: Duration.minutes(1),
      }),
      threshold: 0,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: minutes,
      treatMissingData: props.treatMissingData,
    });
    this.addAlarmAction(new actions.Ec2Action(actions.Ec2InstanceAction.REBOOT));
  }
}
