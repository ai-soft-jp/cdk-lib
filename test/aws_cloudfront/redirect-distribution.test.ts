import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as ais from '../../lib';

describe('MappedRedirect', () => {
  let stack: cdk.Stack;
  beforeEach(() => {
    stack = new cdk.Stack();
  });

  test('simple', () => {
    new ais.cloudfront.RedirectDistribution(stack, 'Dist', {
      redirection: ais.cloudfront.Redirection.simple({ target: 'https://redirect.test/' }),
    });
    Template.fromStack(stack).hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultCacheBehavior: {
          TargetOriginId: 'DistOrigin1F296BFE1',
          ViewerProtocolPolicy: 'redirect-to-https',
          FunctionAssociations: [
            {
              EventType: 'viewer-request',
              FunctionARN: { 'Fn::GetAtt': ['DistRedirectionEF8FFA61', 'FunctionARN'] },
            },
          ],
        },
        Origins: [
          {
            Id: 'DistOrigin1F296BFE1',
            DomainName: 'redirect.aws',
          },
        ],
      },
    });
  });

  test('simple with policy', () => {
    new ais.cloudfront.RedirectDistribution(stack, 'Dist', {
      redirection: ais.cloudfront.Redirection.simple({ target: 'https://redirect.test/' }),
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.ALLOW_ALL,
      responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
    });
    Template.fromStack(stack).hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultCacheBehavior: {
          TargetOriginId: 'DistOrigin1F296BFE1',
          ViewerProtocolPolicy: 'allow-all',
          ResponseHeadersPolicyId: '67f7725c-6f97-4210-82d7-5512b31e9d03',
        },
      },
    });
  });

  test('mapped', () => {
    new ais.cloudfront.RedirectDistribution(stack, 'Dist', {
      redirection: ais.cloudfront.Redirection.mapped({ fallback: 'https://redirect.test/' }),
    });
    Template.fromStack(stack).hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultCacheBehavior: {
          TargetOriginId: 'DistOrigin1F296BFE1',
          ViewerProtocolPolicy: 'redirect-to-https',
          FunctionAssociations: [
            {
              EventType: 'viewer-request',
              FunctionARN: { 'Fn::GetAtt': ['DistRedirection858219E4', 'FunctionARN'] },
            },
          ],
        },
        Origins: [
          {
            Id: 'DistOrigin1F296BFE1',
            DomainName: 'redirect.aws',
          },
        ],
      },
    });
  });

  test('mapped with policy', () => {
    new ais.cloudfront.RedirectDistribution(stack, 'Dist', {
      redirection: ais.cloudfront.Redirection.mapped({ fallback: 'https://redirect.test/' }),
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.ALLOW_ALL,
      responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
    });
    Template.fromStack(stack).hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultCacheBehavior: {
          TargetOriginId: 'DistOrigin1F296BFE1',
          ViewerProtocolPolicy: 'allow-all',
          ResponseHeadersPolicyId: '67f7725c-6f97-4210-82d7-5512b31e9d03',
        },
      },
    });
  });

  test('custom', () => {
    const func = new cloudfront.Function(stack, 'Func', { code: cloudfront.FunctionCode.fromInline('hello()') });
    new ais.cloudfront.RedirectDistribution(stack, 'Dist', {
      redirection: ais.cloudfront.Redirection.custom(func),
    });
    Template.fromStack(stack).hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultCacheBehavior: {
          TargetOriginId: 'DistOrigin1F296BFE1',
          ViewerProtocolPolicy: 'redirect-to-https',
          FunctionAssociations: [
            {
              EventType: 'viewer-request',
              FunctionARN: { 'Fn::GetAtt': ['Func217E03A4', 'FunctionARN'] },
            },
          ],
        },
        Origins: [
          {
            Id: 'DistOrigin1F296BFE1',
            DomainName: 'redirect.aws',
          },
        ],
      },
    });
  });
});
