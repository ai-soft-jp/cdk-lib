import * as path from 'node:path';
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Box } from 'aws-cdk-lib/core/lib/helpers-internal';
import { Construct } from 'constructs';

/**
 * Defines alarms for SES rate and quota
 */
export class QuotaAlarms extends Construct {
  private readonly alarms: cloudwatch.Alarm[];
  private readonly quotaAlarm: cloudwatch.IAlarm;
  private readonly rateAlarm: cloudwatch.IAlarm;
  private readonly crAlarms: cdk.CustomResource;
  readonly alarmActions = Box.fromArray<cloudwatch.IAlarmAction>([]);
  readonly okActions = Box.fromArray<cloudwatch.IAlarmAction>([]);

  constructor(scope: Construct, id: string) {
    super(scope, id);

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
    ];

    this.quotaAlarm = cloudwatch.Alarm.fromAlarmName(
      this,
      'SendQuotaAlarmResource',
      cdk.Names.uniqueResourceName(new Construct(this, 'SendQuotaAlarm'), { maxLength: 255, separator: '-' }),
    );
    this.rateAlarm = cloudwatch.Alarm.fromAlarmName(
      this,
      'SendRateAlarmResource',
      cdk.Names.uniqueResourceName(new Construct(this, 'SendRateAlarm'), { maxLength: 255, separator: '-' }),
    );

    const bindActions = (actions: readonly cloudwatch.IAlarmAction[]) => {
      const actionArns = actions.map((action) => {
        action.bind(this, this.quotaAlarm);
        return action.bind(this, this.rateAlarm).alarmActionArn;
      });
      return actionArns.length === 1 ? actionArns[0] : cdk.Fn.join(',', actionArns);
    };
    const environment: import('./functions/quota-alarms-handler').Env = {
      SEND_QUOTA_ALARM_NAME: this.quotaAlarm.alarmName,
      SEND_RATE_ALARM_NAME: this.rateAlarm.alarmName,
      ALARM_ACTION_ARNS: cdk.Token.asString(this.alarmActions.derive(bindActions)),
      OK_ACTION_ARNS: cdk.Token.asString(this.okActions.derive(bindActions)),
    };

    const handler = new lambda.Function(this, 'ServiceQuotaRuleEventHandler', {
      code: lambda.Code.fromAsset(path.resolve(__dirname, 'functions/quota-alarms-handler')),
      runtime: lambda.Runtime.NODEJS_24_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      durableConfig: { executionTimeout: cdk.Duration.days(30) },
      environment,
    });
    handler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ses:GetAccount', 'servicequotas:GetRequestedServiceQuotaChange'],
        resources: ['*'],
      }),
    );
    handler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cloudwatch:DeleteAlarms', 'cloudwatch:DescribeAlarms', 'cloudwatch:PutMetricAlarm'],
        resources: [this.quotaAlarm.alarmArn, this.rateAlarm.alarmArn],
      }),
    );

    const rule = new events.Rule(this, 'ServiceQuotaRule', {
      eventPattern: {
        source: events.Match.exactString('aws.servicequotas'),
        detailType: events.Match.exactString('AWS API Call via CloudTrail'),
        detail: {
          eventName: events.Match.exactString('RequestServiceQuotaIncrease'),
          responseElements: {
            requestedQuota: {
              serviceCode: events.Match.exactString('ses'),
              quotaName: events.Match.anyOf('Sending rate', 'Sending quota'),
            },
          },
        },
      },
      targets: [new targets.LambdaFunction(handler.latestVersion)],
    });
    cdk.Annotations.of(handler).acknowledgeInfo('aws-lambda:Function.DurableConfig');
    cdk.Annotations.of(handler).acknowledgeWarning('UnclearLambdaEnvironment');
    handler.addPermission(`AllowEventRules${cdk.Names.nodeUniqueId(handler.node)}`, {
      scope: rule,
      action: 'lambda:InvokeFunction',
      principal: new iam.ServicePrincipal('events.amazonaws.com'),
      sourceArn: rule.ruleArn,
    });

    this.crAlarms = new cdk.CustomResource(this, 'CreateAlarms', {
      serviceToken: handler.latestVersion.functionArn,
      serviceTimeout: cdk.Duration.seconds(10),
    });
    cdk.Validations.of(this.crAlarms).acknowledge({
      id: 'CloudFormation-Validate::W9003',
      reason: 'ServiceTimeout is converted to string',
    });

    cdk.RemovalPolicies.of(this).destroy({ applyToResourceTypes: ['AWS::Logs::LogGroup'] });
  }

  /**
   * Trigger this action if the alarm fires
   */
  addAlarmAction(...actions: cloudwatch.IAlarmAction[]) {
    this.alarmActions.push(...actions);
    this.alarms.forEach((alarm) => alarm.addAlarmAction(...actions));
  }

  /**
   * Trigger this action if the alarm returns from breaching state into ok state
   */
  addOkAction(...actions: cloudwatch.IAlarmAction[]) {
    this.okActions.push(...actions);
    this.alarms.forEach((alarm) => alarm.addOkAction(...actions));
  }

  /**
   * Add an alarm mute rule.
   */
  addAlarmMuteRule(id: string, options: cloudwatch.AlarmMuteRuleOptions) {
    const muteRule = new cloudwatch.AlarmMuteRule(this, id, {
      ...options,
      alarms: [...this.alarms, this.quotaAlarm, this.rateAlarm],
    });
    muteRule.node.addDependency(this.crAlarms);
    return muteRule;
  }
}
