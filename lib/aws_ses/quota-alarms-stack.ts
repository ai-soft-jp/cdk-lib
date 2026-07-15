import * as path from 'node:path';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as scheduler from 'aws-cdk-lib/aws-scheduler';
import * as targets from 'aws-cdk-lib/aws-scheduler-targets';
import type { Construct } from 'constructs';
import { QuotaAlarms } from './quota-alarms';

/**
 * Properties for QuotaAlarmsStack
 */
export interface QuotaAlarmsStackProps extends cdk.StackProps {
  /**
   * The schedule to check quota
   * @default - Weekly
   */
  readonly schedule?: scheduler.ScheduleExpression;
  /**
   * A time window during which EventBridge Scheduler invokes the schedule.
   * @default TimeWindow.off()
   */
  readonly timeWindow?: scheduler.TimeWindow;
  /**
   * Indicates whether the schedule is enabled.
   * @default true
   */
  readonly enabled?: boolean;
}

/**
 * Defines self-update alarms for SES rate and quota
 */
export class QuotaAlarmsStack extends cdk.Stack {
  /**
   * The alarms
   */
  readonly alarms: QuotaAlarms;

  constructor(scope: Construct, id: string, props?: QuotaAlarmsStackProps) {
    super(scope, id, props);

    const parameter = new cdk.CfnParameter(this, 'Version', {
      description: 'The version of SesQuotaAlarms',
      default: 'DefaultVersion',
    });
    this.alarms = new QuotaAlarms(this, 'QuotaAlarms', {
      version: parameter.valueAsString,
    });

    const handler = new lambda.Function(this, 'Handler', {
      code: lambda.Code.fromAsset(path.resolve(__dirname, 'functions/quota-alarms-schedule')),
      runtime: lambda.Runtime.NODEJS_24_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
    });
    handler.addToRolePolicy(new iam.PolicyStatement({ actions: ['ses:GetAccount'], resources: ['*'] }));
    handler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cloudformation:DescribeStacks', 'cloudformation:UpdateStack'],
        resources: [this.stackId],
      }),
    );

    new scheduler.Schedule(this, 'Schedule', {
      schedule: props?.schedule ?? scheduler.ScheduleExpression.rate(cdk.Duration.days(7)),
      timeWindow: props?.timeWindow,
      enabled: props?.enabled,
      target: new targets.LambdaInvoke(handler, {
        retryAttempts: 0,
        input: scheduler.ScheduleTargetInput.fromObject({
          StackName: this.stackName,
        } satisfies import('./functions/quota-alarms-schedule').InputPayload),
      }),
    });

    cdk.RemovalPolicies.of(this).destroy({ applyToResourceTypes: ['AWS::Logs::LogGroup'] });
  }
}
