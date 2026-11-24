import * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { QuotaAlarms } from './quota-alarms';

/**
 * Defines self-update alarms for SES rate and quota
 * @deprecated use QuotaAlarms directly
 */
export class QuotaAlarmsStack extends cdk.Stack {
  /**
   * The alarms
   */
  readonly alarms: QuotaAlarms;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.alarms = new QuotaAlarms(this, 'QuotaAlarms');
  }
}
