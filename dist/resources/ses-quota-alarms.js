import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
const EVENT_HANDLER = `
const { SESv2 } = require('@aws-sdk/client-sesv2');
const ses = new SESv2();
exports.handler = async () => {
  const res = await ses.getAccount({});
  const { Max24HourSend, MaxSendRate } = res.SendQuota;
  return {
    Data: {
      Max24HourSend: Max24HourSend,
      Max24HourSendThreshold: Max24HourSend * 0.8,
      MaxSendRate: MaxSendRate,
      MaxSendRateThreshold: MaxSendRate * 0.9 * 60 * 5,
    },
  };
};
`;
/**
 * Defines alarms for SES rate and quota
 */
export class SesQuotaAlarms extends Construct {
    alarms;
    constructor(scope, id, props) {
        super(scope, id);
        const handler = new lambda.Function(this, 'Handler', {
            code: lambda.Code.fromInline(EVENT_HANDLER),
            runtime: lambda.Runtime.NODEJS_24_X,
            architecture: lambda.Architecture.ARM_64,
            handler: 'index.handler',
        });
        handler.addToRolePolicy(new iam.PolicyStatement({ actions: ['ses:GetAccount'], resources: ['*'] }));
        const provider = new cr.Provider(this, 'Provider', {
            onEventHandler: handler,
        });
        const quota = new cdk.CustomResource(this, 'GetQuota', {
            resourceType: 'Custom::GetSesQuota',
            serviceToken: provider.serviceToken,
            properties: { version: props?.version ?? `${Date.now()}` },
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        this.alarms = [
            new cloudwatch.Alarm(this, 'HighBounceRateAlarm', {
                alarmDescription: `SES Reputation.BounceRate >= 5%`,
                metric: new cloudwatch.Metric({
                    namespace: 'AWS/SES',
                    metricName: `Reputation.BounceRate`,
                    statistic: cloudwatch.Stats.MAXIMUM,
                    period: cdk.Duration.minutes(5),
                }),
                evaluationPeriods: 1,
                threshold: 0.05,
                treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
            }),
            new cloudwatch.Alarm(this, 'HighComplaintRateAlarm', {
                alarmDescription: `SES Reputation.ComplaintRate >= 0.1%`,
                metric: new cloudwatch.Metric({
                    namespace: 'AWS/SES',
                    metricName: `Reputation.ComplaintRate`,
                    statistic: cloudwatch.Stats.MAXIMUM,
                    period: cdk.Duration.minutes(5),
                }),
                evaluationPeriods: 1,
                threshold: 0.001,
                treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
            }),
            new cloudwatch.Alarm(this, 'SendQuotaAlarm', {
                alarmDescription: `SES SendQuota > 80% (max ${quota.getAttString('Max24HourSend')}/day)`,
                metric: new cloudwatch.Metric({
                    metricName: 'Send',
                    namespace: 'AWS/SES',
                    statistic: cloudwatch.Stats.SUM,
                    period: cdk.Duration.days(1),
                }),
                evaluationPeriods: 1,
                datapointsToAlarm: 1,
                threshold: cdk.Token.asNumber(quota.getAtt('Max24HourSendThreshold')),
                comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
            }),
            new cloudwatch.Alarm(this, 'SendRateAlarm', {
                alarmDescription: `SES SendRate > 90% (max ${quota.getAttString('MaxSendRate')}/sec)`,
                metric: new cloudwatch.Metric({
                    metricName: 'Send',
                    namespace: 'AWS/SES',
                    statistic: cloudwatch.Stats.SUM,
                    period: cdk.Duration.minutes(5),
                }),
                evaluationPeriods: 1,
                datapointsToAlarm: 1,
                threshold: cdk.Token.asNumber(quota.getAtt('MaxSendRateThreshold')),
                comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
            }),
        ];
        cdk.RemovalPolicies.of(this).destroy({ applyToResourceTypes: ['AWS::Logs::LogGroup'] });
    }
    /**
     * Trigger this action if the alarm fires
     */
    addAlarmAction(...actions) {
        for (const alarm of this.alarms) {
            alarm.addAlarmAction(...actions);
        }
    }
    /**
     * Trigger this action if the alarm returns from breaching state into ok state
     */
    addOkAction(...actions) {
        for (const alarm of this.alarms) {
            alarm.addOkAction(...actions);
        }
    }
}
//# sourceMappingURL=ses-quota-alarms.js.map