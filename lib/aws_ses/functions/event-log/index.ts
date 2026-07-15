export const handler: AWSLambda.SNSHandler = async (event) => {
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
