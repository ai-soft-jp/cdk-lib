import * as lambda from 'aws-cdk-lib/aws-lambda';
import type * as logs from 'aws-cdk-lib/aws-logs';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

/**
 * Properties for SesEventLog
 */
export interface SesEventLogProps {
  /**
   * The configuration set
   */
  readonly configurationSet: ses.IConfigurationSetRef;
  /**
   * The SES events to log
   * @default - Send, Delivery, DeliveryDelay, Bounce, Complaint, Reject, RenderingFailure
   */
  readonly events?: ses.EmailSendingEvent[];
  /**
   * The log group
   * @default - Automatically created
   */
  readonly logGroup?: logs.ILogGroupRef;
}

const EVENT_HANDLER = `\
exports.handler = async (event) => {
  for (const record of event.Records) {
    try {
      console.log(JSON.parse(record.Sns.Message));
    } catch (err) {
      console.log({
        error: String(err),
        record: {
          Type: record.Sns.Type,
          Subject: record.Sns.Subject,
          Message: record.Sns.Message,
          MessageAttributes: record.Sns.MessageAttributes,
          MessageId: record.Sns.MessageId,
        },
      });
    }
  }
};
`;

/**
 * Creates a SES event destination which logs SES events
 */
export class SesEventLog extends Construct {
  /**
   * The SNS topic
   */
  readonly topic: sns.Topic;

  constructor(scope: Construct, id: string, props: SesEventLogProps) {
    super(scope, id);

    const topic = new sns.Topic(this, 'Topic');

    const handler = new lambda.Function(this, 'LogHandler', {
      description: 'SES event logger handler',
      code: lambda.Code.fromInline(EVENT_HANDLER),
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: 'index.handler',
      loggingFormat: lambda.LoggingFormat.JSON,
      systemLogLevelV2: lambda.SystemLogLevel.WARN,
      logGroup: props.logGroup,
    });
    topic.addSubscription(new subscriptions.LambdaSubscription(handler));

    new ses.ConfigurationSetEventDestination(this, 'EventDestination', {
      configurationSet: props.configurationSet,
      events: props.events ?? [
        ses.EmailSendingEvent.SEND,
        ses.EmailSendingEvent.DELIVERY,
        ses.EmailSendingEvent.DELIVERY_DELAY,
        ses.EmailSendingEvent.BOUNCE,
        ses.EmailSendingEvent.COMPLAINT,
        ses.EmailSendingEvent.REJECT,
        ses.EmailSendingEvent.RENDERING_FAILURE,
      ],
      destination: ses.EventDestination.snsTopic(topic),
    });

    this.topic = topic;
  }
}
