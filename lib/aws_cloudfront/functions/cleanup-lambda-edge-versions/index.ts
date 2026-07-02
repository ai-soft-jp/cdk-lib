import { DeleteFunctionCommand, LambdaClient, paginateListVersionsByFunction } from '@aws-sdk/client-lambda';
import type { CloudFormationCustomResourceHandler, CloudFormationCustomResourceResponse } from 'aws-lambda';

const lambda = new LambdaClient({ region: 'us-east-1' });

export interface ResourceProperties {
  /** Lambda@Edge */
  readonly Lambdas: { functionName: string; version: string }[];
}

export const handler: CloudFormationCustomResourceHandler = async (event) => {
  if (event.RequestType === 'Create' || event.RequestType === 'Update') {
    const props = event.ResourceProperties as unknown as ResourceProperties;
    for (const { functionName } of props.Lambdas) {
      const versions = await getFunctionVersions(functionName);

      const keepVersions = versions.splice(0, 3);
      console.log(`${functionName}: keeping version(s): ${keepVersions.map((v) => v).join(',')}`);

      for (const version of versions) {
        await deleteVersion(functionName, version);
      }
    }
  }

  await respondToCloudFormation(event.ResponseURL, {
    Status: 'SUCCESS',
    PhysicalResourceId: event.RequestType !== 'Create' ? event.PhysicalResourceId : event.RequestId,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    NoEcho: false,
  });
};

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

async function respondToCloudFormation(url: string, body: CloudFormationCustomResourceResponse) {
  await fetch(url, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
