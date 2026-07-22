import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';

const sts = new STSClient();

// Ensure __filename and __dirname can be redefined.
var __filename: string; // eslint-disable-line no-var,no-unassigned-vars

export const handler: AWSLambda.Handler = async () => {
  const res = await sts.send(new GetCallerIdentityCommand());
  return { account: res.Account, __filename, __dirname };
};
