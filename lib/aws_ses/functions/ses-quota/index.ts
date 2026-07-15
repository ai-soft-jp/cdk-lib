import { GetAccountCommand, SESv2Client } from '@aws-sdk/client-sesv2';

const ses = new SESv2Client();

export const handler: AWSLambda.Handler = async () => {
  const res = await ses.send(new GetAccountCommand({}));
  const { Max24HourSend, MaxSendRate } = res.SendQuota!;
  return {
    Data: {
      Max24HourSend: Max24HourSend,
      Max24HourSendThreshold: Max24HourSend! * 0.8,
      MaxSendRate: MaxSendRate,
      MaxSendRateThreshold: MaxSendRate! * 0.9 * 60 * 5,
    },
  };
};
