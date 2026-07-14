export const handler: AWSLambda.CloudFrontRequestHandler = async (event) => {
  return event.Records[0]!.cf.request;
};
