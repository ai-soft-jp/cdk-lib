import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as scheduler from 'aws-cdk-lib/aws-scheduler';
import * as targets from 'aws-cdk-lib/aws-scheduler-targets';
import type { Construct } from 'constructs';
import { SesQuotaAlarms } from '../resources/ses-quota-alarms.js';

/**
 * Properties for SesQuotaAlarmsStack
 */
export interface SesQuotaAlarmsStackProps extends cdk.StackProps {
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

const EVENT_HANDLER = `
const { SESv2 } = require('@aws-sdk/client-sesv2');
const { CloudFormation } = require('@aws-sdk/client-cloudformation');
const ses = new SESv2();
const cfn = new CloudFormation();
exports.handler = async (event) => {
  const { SendQuota } = await ses.getAccount({});
  const version = [SendQuota.Max24HourSend, SendQuota.MaxSendRate].join('/');
  const res = await cfn.describeStacks({ StackName: event.StackName });
  const versionParameter = res.Stacks[0].Parameters.find((p) => p.ParameterKey === 'Version');
  const prevVersion = versionParameter?.ResolvedValue ?? versionParameter?.ParameterValue;
  if (prevVersion !== version) {
    console.log(\`Update stack \${event.StackName}: \${prevVersion} => \${version}\`);
    await cfn.updateStack({
      StackName: event.StackName,
      UsePreviousTemplate: true,
      Capabilities: ['CAPABILITY_IAM'],
      Parameters: [{ ParameterKey: 'Version', ParameterValue: version }],
    });
  }
};
`;

/**
 * Defines self-update alarms for SES rate and quota
 */
export class SesQuotaAlarmsStack extends cdk.Stack {
  /**
   * The alarms
   */
  readonly alarms: SesQuotaAlarms;

  constructor(scope: Construct, id: string, props?: SesQuotaAlarmsStackProps) {
    super(scope, id, props);

    const parameter = new cdk.CfnParameter(this, 'Version', {
      description: 'The version of SesQuotaAlarms',
      default: 'DefaultVersion',
    });
    this.alarms = new SesQuotaAlarms(this, 'QuotaAlarms', {
      version: parameter.valueAsString,
    });

    const handler = new lambda.Function(this, 'Handler', {
      code: lambda.Code.fromInline(EVENT_HANDLER),
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
        input: scheduler.ScheduleTargetInput.fromObject({ StackName: this.stackName }),
      }),
    });

    cdk.RemovalPolicies.of(this).destroy({ applyToResourceTypes: ['AWS::Logs::LogGroup'] });
  }
}
