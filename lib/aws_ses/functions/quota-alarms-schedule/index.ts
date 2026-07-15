import { CloudFormationClient, DescribeStacksCommand, UpdateStackCommand } from '@aws-sdk/client-cloudformation';
import { GetAccountCommand, SESv2Client } from '@aws-sdk/client-sesv2';

export type InputPayload = { readonly StackName: string };

const ses = new SESv2Client();
const cfn = new CloudFormationClient();

export const handler: AWSLambda.Handler<InputPayload> = async (event) => {
  const { SendQuota } = await ses.send(new GetAccountCommand({}));
  const version = [SendQuota!.Max24HourSend, SendQuota!.MaxSendRate].join('/');

  const res = await cfn.send(new DescribeStacksCommand({ StackName: event.StackName }));
  const versionParameter = res.Stacks?.[0]?.Parameters?.find((p) => p.ParameterKey === 'Version');
  const prevVersion = versionParameter?.ResolvedValue ?? versionParameter?.ParameterValue;

  if (prevVersion !== version) {
    console.log(`Update stack ${event.StackName}: ${prevVersion} => ${version}`);
    await cfn.send(
      new UpdateStackCommand({
        StackName: event.StackName,
        UsePreviousTemplate: true,
        Capabilities: ['CAPABILITY_IAM'],
        Parameters: [{ ParameterKey: 'Version', ParameterValue: version }],
      }),
    );
  }
};
