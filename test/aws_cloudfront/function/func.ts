declare const VALUE: string;

function handler(event: AWSCloudFrontFunction.Event): AWSCloudFrontFunction.Request | AWSCloudFrontFunction.Response {
  const request = event.request;
  request.headers['x-value'] = { value: VALUE };
  return request;
}
