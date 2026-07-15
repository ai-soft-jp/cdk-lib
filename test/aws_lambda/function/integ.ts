import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';

const sts = new STSClient();

export const handler: AWSLambda.Handler = async () => {
  const res = await sts.send(new GetCallerIdentityCommand());
  return res.Account;
};
