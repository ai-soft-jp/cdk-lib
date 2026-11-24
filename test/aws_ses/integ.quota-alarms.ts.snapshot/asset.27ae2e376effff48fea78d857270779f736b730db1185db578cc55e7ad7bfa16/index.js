"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const durable_execution_sdk_js_1 = require("@aws/durable-execution-sdk-js");
const client_cloudwatch_1 = require("@aws-sdk/client-cloudwatch");
const client_service_quotas_1 = require("@aws-sdk/client-service-quotas");
const client_sesv2_1 = require("@aws-sdk/client-sesv2");
const env = process.env;
const cloudwatch = new client_cloudwatch_1.CloudWatchClient({ logger: console });
const quotas = new client_service_quotas_1.ServiceQuotasClient({ logger: console });
const ses = new client_sesv2_1.SESv2Client({ logger: console });
exports.handler = (0, durable_execution_sdk_js_1.withDurableExecution)(async (event, context) => {
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
    const state = await context.waitForCondition('WaitForCaseClose', async () => {
        const res = await quotas.send(new client_service_quotas_1.GetRequestedServiceQuotaChangeCommand({ RequestId: requestId }));
        return res.RequestedQuota?.Status ?? 'INVALID_REQUEST';
    }, {
        initialState: 'CASE_OPENED',
        waitStrategy: (0, durable_execution_sdk_js_1.createWaitStrategy)({
            shouldContinuePolling: (state) => ['PENDING', 'CASE_OPENED'].includes(state),
            maxAttempts: 720,
            initialDelay: { minutes: 5 },
            maxDelay: { minutes: 60 },
        }),
    });
    console.log(`Requested Quota Change is ${state}`);
    if (['DENIED', 'NOT_APPROVED', 'INVALID_REQUEST'].includes(state)) {
        return;
    }
    await context.wait('FinalWait', { minutes: 30 });
    await context.step('UpdateAlarms', updateAlarms);
});
async function processCloudFormation(event) {
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
    const res = await ses.send(new client_sesv2_1.GetAccountCommand({}));
    return res.SendQuota;
}
async function getAlarms() {
    try {
        const res = await cloudwatch.send(new client_cloudwatch_1.DescribeAlarmsCommand({ AlarmNames: [env.SEND_QUOTA_ALARM_NAME, env.SEND_RATE_ALARM_NAME] }));
        return Object.fromEntries((res.MetricAlarms ?? []).map((alarm) => [alarm.AlarmName, alarm]));
    }
    catch (_err) {
        return {};
    }
}
async function updateAlarms() {
    const quota = await getSesQuota();
    const alarms = await getAlarms();
    const alarmActions = env.ALARM_ACTION_ARNS?.split(',');
    const okActions = env.OK_ACTION_ARNS?.split(',');
    await Promise.allSettled([
        cloudwatch.send(new client_cloudwatch_1.PutMetricAlarmCommand(mergeMetricAlarm(alarms[env.SEND_QUOTA_ALARM_NAME], {
            AlarmName: env.SEND_QUOTA_ALARM_NAME,
            AlarmDescription: `SES SendQuota > 80% (max ${quota.Max24HourSend}/day)`,
            ActionsEnabled: true,
            Namespace: 'AWS/SES',
            MetricName: 'Send',
            Statistic: 'Sum',
            Period: 86400,
            EvaluationPeriods: 1,
            DatapointsToAlarm: 1,
            Threshold: quota.Max24HourSend * 0.8,
            ComparisonOperator: 'GreaterThanThreshold',
            TreatMissingData: 'notBreaching',
            AlarmActions: alarmActions,
            OKActions: okActions,
        }))),
        cloudwatch.send(new client_cloudwatch_1.PutMetricAlarmCommand(mergeMetricAlarm(alarms[env.SEND_RATE_ALARM_NAME], {
            AlarmName: env.SEND_RATE_ALARM_NAME,
            AlarmDescription: `SES SendRate > 90% (max ${quota.MaxSendRate}/sec)`,
            ActionsEnabled: true,
            Namespace: 'AWS/SES',
            MetricName: 'Send',
            Statistic: 'Sum',
            Period: 300,
            EvaluationPeriods: 1,
            DatapointsToAlarm: 1,
            Threshold: quota.MaxSendRate * 0.9 * 300,
            ComparisonOperator: 'GreaterThanThreshold',
            TreatMissingData: 'notBreaching',
            AlarmActions: alarmActions,
            OKActions: okActions,
        }))),
    ]);
}
function mergeMetricAlarm(current, input) {
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
        await cloudwatch.send(new client_cloudwatch_1.DeleteAlarmsCommand({ AlarmNames: [env.SEND_QUOTA_ALARM_NAME, env.SEND_RATE_ALARM_NAME] }));
    }
    catch (_err) {
        // ok
    }
}
//# sourceMappingURL=index.js.map