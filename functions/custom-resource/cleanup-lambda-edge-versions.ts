/**
 * CloudFormationカスタムリソース - Lambda@Edgeのクリンナップ
 */
import { DeleteFunctionCommand, LambdaClient, paginateListVersionsByFunction } from '@aws-sdk/client-lambda';
import { CfnHandler } from '../../lib/custom_resource/cfn-response';

const lambda = new LambdaClient({ region: 'us-east-1' });

interface ResourceProperties {
  /** Lambda@Edge */
  readonly Lambdas: { functionName: string; version: string }[];
}

class Handler extends CfnHandler<ResourceProperties> {
  physicalResourceId = process.env.AWS_LAMBDA_FUNCTION_NAME;

  async handleUpdate() {
    for (const { functionName } of this.props.Lambdas) {
      const versions = await getFunctionVersions(functionName);

      const keepVersions = versions.splice(0, 3);
      console.log(`${functionName}: keeping version(s): ${keepVersions.map((v) => v).join(',')}`);

      for (const version of versions) {
        await deleteVersion(functionName, version);
      }
    }
  }
}

export const handler = Handler.handler();

async function getFunctionVersions(functionName: string) {
  const versions: number[] = [];

  for await (const res of paginateListVersionsByFunction({ client: lambda }, { FunctionName: functionName })) {
    for (const { Version } of res.Versions || []) {
      if (Version && /^\d+$/.test(Version)) versions.push(parseInt(Version, 10));
    }
  }

  return versions.sort((a, b) => b - a);
}

async function deleteVersion(functionName: string, version: number) {
  try {
    await lambda.send(new DeleteFunctionCommand({ FunctionName: functionName, Qualifier: `${version}` }));
    console.log(`${functionName}: deleted version ${version}.`);
  } catch (err) {
    console.log(`${functionName}: failed to delete version ${version}: ${err}`);
  }
}
