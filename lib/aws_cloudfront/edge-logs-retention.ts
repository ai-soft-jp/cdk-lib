import * as path from 'node:path';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as scheduler from 'aws-cdk-lib/aws-scheduler';
import * as targets from 'aws-cdk-lib/aws-scheduler-targets';
import { Construct } from 'constructs';

export interface EdgeLogsRetentionProps {
  readonly scheduleGroup?: scheduler.IScheduleGroup;
  readonly enabled?: boolean;
}

export class EdgeLogsRetention extends Construct {
  constructor(scope: Construct, id: string, props?: EdgeLogsRetentionProps) {
    super(scope, id);

    const handler = new lambda.Function(this, 'Handler', {
      description: `[${this.node.path}] Update Lambda@Edge logs retention`,
      code: lambda.Code.fromAsset(path.resolve(__dirname, 'functions/update-lambda-edge-logs-retention')),
      handler: 'index.handler',
      timeout: cdk.Duration.minutes(1),
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_24_X,
      loggingFormat: lambda.LoggingFormat.TEXT,
    });
    handler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ec2:DescribeRegions', 'logs:DescribeLogGroups'],
        resources: ['*'],
      }),
    );
    handler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['logs:PutRetentionPolicy'],
        resources: [
          cdk.Stack.of(this).formatArn({
            service: 'logs',
            region: '*',
            resource: 'log-group',
            resourceName: '/aws/lambda/us-east-1.*',
            arnFormat: cdk.ArnFormat.COLON_RESOURCE_NAME,
          }),
        ],
      }),
    );

    new scheduler.Schedule(this, 'Schedule', {
      description: `[${this.node.path}] Update Lambda@Edge logs retention`,
      schedule: scheduler.ScheduleExpression.rate(cdk.Duration.days(7)),
      timeWindow: scheduler.TimeWindow.flexible(cdk.Duration.days(1)),
      scheduleGroup: props?.scheduleGroup,
      target: new targets.LambdaInvoke(handler, { retryAttempts: 0 }),
      enabled: props?.enabled,
    });
  }
}
