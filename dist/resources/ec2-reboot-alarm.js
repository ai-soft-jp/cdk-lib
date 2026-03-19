import { Duration } from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
/**
 * EC2 Reboot action alarm
 */
export class Ec2RebootAlarm extends cloudwatch.Alarm {
    constructor(scope, id, props) {
        const minutes = props.minutes ?? 10;
        super(scope, id, {
            alarmDescription: props.description ?? `[${scope.node.path}] Auto Reboot: StatusCheckFailed for ${minutes} minutes`,
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
//# sourceMappingURL=ec2-reboot-alarm.js.map