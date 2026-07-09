import { setTimeout } from 'node:timers/promises';
import {
  CloudWatchLogsClient,
  paginateDescribeLogGroups,
  PutRetentionPolicyCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { DescribeRegionsCommand, EC2Client } from '@aws-sdk/client-ec2';
import type { Handler } from 'aws-lambda';

const ec2 = new EC2Client();

export const handler: Handler = async () => {
  const res = await ec2.send(new DescribeRegionsCommand());
  await Promise.allSettled(res.Regions!.map((region) => processRegion(region.RegionName!)));
};

async function processRegion(region: string) {
  const logs = new CloudWatchLogsClient({ region });
  const req = paginateDescribeLogGroups({ client: logs }, { logGroupNamePrefix: '/aws/lambda/us-east-1.' });
  for await (const res of req) {
    for (const logGroup of res.logGroups ?? []) {
      if (!logGroup.retentionInDays) {
        const input = { logGroupName: logGroup.logGroupName, retentionInDays: 30 };
        console.log({ region, ...input });
        await logs.send(new PutRetentionPolicyCommand(input));
        await setTimeout(1000 / 5);
      }
    }
    await setTimeout(1000 / 10);
  }
}
