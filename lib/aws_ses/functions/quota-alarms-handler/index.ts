import type { DurableContext } from '@aws/durable-execution-sdk-js';
import { createWaitStrategy, withDurableExecution } from '@aws/durable-execution-sdk-js';
import type { MetricAlarm, PutMetricAlarmCommandInput } from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchClient,
  DeleteAlarmsCommand,
  DescribeAlarmsCommand,
  PutMetricAlarmCommand,
} from '@aws-sdk/client-cloudwatch';
import type {
  RequestServiceQuotaIncreaseRequest,
  RequestServiceQuotaIncreaseResponse,
  RequestStatus,
} from '@aws-sdk/client-service-quotas';
import { GetRequestedServiceQuotaChangeCommand, ServiceQuotasClient } from '@aws-sdk/client-service-quotas';
import { GetAccountCommand, SESv2Client } from '@aws-sdk/client-sesv2';
import type { CamelCase } from 'ts-essentials';

export type Env = {
  readonly SEND_QUOTA_ALARM_NAME: string;
  readonly SEND_RATE_ALARM_NAME: string;
  readonly ALARM_ACTION_ARNS?: string;
  readonly OK_ACTION_ARNS?: string;
};

type CamelizeKeys<T> = T extends Date
  ? number
  : T extends object
    ? { [Key in keyof T as CamelCase<Key>]: CamelizeKeys<T[Key]> }
    : T;
interface RequestedServiceQuotaChangeDetail {
  readonly eventName: string;
  readonly requestParameters: CamelizeKeys<RequestServiceQuotaIncreaseRequest>;
  readonly responseElements: CamelizeKeys<RequestServiceQuotaIncreaseResponse>;
}

const env = process.env as Env;
const cloudwatch = new CloudWatchClient({ logger: console });
const quotas = new ServiceQuotasClient({ logger: console });
const ses = new SESv2Client({ logger: console });

export const handler = withDurableExecution(
  async (
    event:
      | AWSLambda.EventBridgeEvent<'AWS API Call via CloudTrail', RequestedServiceQuotaChangeDetail>
      | AWSLambda.CloudFormationCustomResourceEvent,
    context: DurableContext,
  ) => {
    console.log(JSON.stringify(event));

    if ('RequestType' in event) {
      await context.step('CloudFormation', () => processCloudFormation(event));
      return;
    }

    const requestId = event.detail.responseElements?.requestedQuota?.id;
    if (!requestId) {
      console.log(`Unexpected event structure: responseElements.requestedQuota.id is blank`);
      return;
    }

    await context.wait('InitialWait', { minutes: 5 });

    const state = await context.waitForCondition(
      'WaitForCaseClose',
      async () => {
        const res = await quotas.send(new GetRequestedServiceQuotaChangeCommand({ RequestId: requestId }));
        return res.RequestedQuota?.Status ?? 'INVALID_REQUEST';
      },
      {
        initialState: 'CASE_OPENED' as RequestStatus,
        waitStrategy: createWaitStrategy({
          shouldContinuePolling: (state) => ['PENDING', 'CASE_OPENED'].includes(state),
          maxAttempts: 720,
          initialDelay: { minutes: 5 },
          maxDelay: { minutes: 60 },
        }),
      },
    );

    console.log(`Requested Quota Change is ${state}`);
    if (['DENIED', 'NOT_APPROVED', 'INVALID_REQUEST'].includes(state)) {
      return;
    }

    await context.wait('FinalWait', { minutes: 30 });
    await context.step('UpdateAlarms', updateAlarms);
  },
);

async function processCloudFormation(event: AWSLambda.CloudFormationCustomResourceEvent) {
  switch (event.RequestType) {
    case 'Create':
    case 'Update':
      await updateAlarms();
      break;
    case 'Delete':
      await deleteAlarms();
      break;
  }
  await fetch(event.ResponseURL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Status: 'SUCCESS',
      PhysicalResourceId: 'SesQuotaAlarms',
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
    }),
  });
}

async function getSesQuota() {
  const res = await ses.send(new GetAccountCommand({}));
  return res.SendQuota!;
}

async function getAlarms() {
  try {
    const res = await cloudwatch.send(
      new DescribeAlarmsCommand({ AlarmNames: [env.SEND_QUOTA_ALARM_NAME, env.SEND_RATE_ALARM_NAME] }),
    );
    return Object.fromEntries((res.MetricAlarms ?? []).map((alarm) => [alarm.AlarmName!, alarm]));
  } catch (_err) {
    return {};
  }
}

async function updateAlarms() {
  const quota = await getSesQuota();
  const alarms = await getAlarms();
  const alarmActions = env.ALARM_ACTION_ARNS?.split(',');
  const okActions = env.OK_ACTION_ARNS?.split(',');

  await Promise.allSettled([
    cloudwatch.send(
      new PutMetricAlarmCommand(
        mergeMetricAlarm(alarms[env.SEND_QUOTA_ALARM_NAME], {
          AlarmName: env.SEND_QUOTA_ALARM_NAME,
          AlarmDescription: `SES SendQuota > 80% (max ${quota.Max24HourSend}/day)`,
          ActionsEnabled: true,
          Namespace: 'AWS/SES',
          MetricName: 'Send',
          Statistic: 'Sum',
          Period: 86400,
          EvaluationPeriods: 1,
          DatapointsToAlarm: 1,
          Threshold: quota.Max24HourSend! * 0.8,
          ComparisonOperator: 'GreaterThanThreshold',
          TreatMissingData: 'notBreaching',
          AlarmActions: alarmActions,
          OKActions: okActions,
        }),
      ),
    ),
    cloudwatch.send(
      new PutMetricAlarmCommand(
        mergeMetricAlarm(alarms[env.SEND_RATE_ALARM_NAME], {
          AlarmName: env.SEND_RATE_ALARM_NAME,
          AlarmDescription: `SES SendRate > 90% (max ${quota.MaxSendRate}/sec)`,
          ActionsEnabled: true,
          Namespace: 'AWS/SES',
          MetricName: 'Send',
          Statistic: 'Sum',
          Period: 300,
          EvaluationPeriods: 1,
          DatapointsToAlarm: 1,
          Threshold: quota.MaxSendRate! * 0.9 * 300,
          ComparisonOperator: 'GreaterThanThreshold',
          TreatMissingData: 'notBreaching',
          AlarmActions: alarmActions,
          OKActions: okActions,
        }),
      ),
    ),
  ]);
}

function mergeMetricAlarm(
  current: MetricAlarm | undefined,
  input: PutMetricAlarmCommandInput,
): PutMetricAlarmCommandInput {
  return {
    ...input,
    AlarmName: current?.AlarmName ?? input.AlarmName,
    ActionsEnabled: current?.ActionsEnabled ?? input.ActionsEnabled,
    AlarmActions: current?.AlarmActions ?? input.AlarmActions,
    InsufficientDataActions: current?.InsufficientDataActions ?? input.InsufficientDataActions,
    OKActions: current?.OKActions ?? input.OKActions,
  };
}

async function deleteAlarms() {
  try {
    await cloudwatch.send(
      new DeleteAlarmsCommand({ AlarmNames: [env.SEND_QUOTA_ALARM_NAME, env.SEND_RATE_ALARM_NAME] }),
    );
  } catch (_err) {
    // ok
  }
}
