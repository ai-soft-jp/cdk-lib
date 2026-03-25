import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
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
    topic;
    constructor(scope, id, props) {
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
//# sourceMappingURL=ses-event-log.js.map