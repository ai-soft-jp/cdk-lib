import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as ais from '../../lib';

describe('Certificate', () => {
  describe('on us-east-1', () => {
    let stack: cdk.Stack;
    let zone: route53.HostedZone;
    beforeEach(() => {
      stack = new cdk.Stack(undefined, undefined, { env: { region: 'us-east-1' } });
      zone = new route53.HostedZone(stack, 'HostedZone', { zoneName: 'example.com' });
    });

    test('defines an ACM certificate directly', () => {
      new ais.cloudfront.Certificate(stack, 'Certificate', { zone, domainName: 'www.example.com' });
      Template.fromStack(stack).hasResourceProperties('AWS::CertificateManager::Certificate', {
        DomainName: 'www.example.com',
      });
    });
  });

  describe('on ap-northeast-1', () => {
    let app: cdk.App;
    let stack: cdk.Stack;
    let zone: route53.HostedZone;
    beforeEach(() => {
      app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStack', { env: { region: 'ap-northeast-1' } });
      zone = new route53.HostedZone(stack, 'HostedZone', { zoneName: 'example.com' });
    });

    test('defines the CertificateStack in us-east-1', () => {
      new ais.cloudfront.Certificate(stack, 'Certificate', { zone, domainName: 'www.example.com' });
      const certificateStack = stack.node.tryFindChild('CertificateStack');
      expect(certificateStack).toBeInstanceOf(cdk.Stack);
      expect(cdk.Stack.of(certificateStack!).region).toEqual('us-east-1');
    });

    test('defines an ACM certificate in CertificateStack', () => {
      new ais.cloudfront.Certificate(stack, 'Certificate', { zone, domainName: 'www.example.com' });
      Template.fromStack(stack.node.tryFindChild('CertificateStack') as cdk.Stack).hasResourceProperties(
        'AWS::CertificateManager::Certificate',
        {
          DomainName: 'www.example.com',
        },
      );
    });

    test('consume certificateId', () => {
      const certificate = new ais.cloudfront.Certificate(stack, 'Certificate', { zone, domainName: 'www.example.com' });
      const consumeStack = new cdk.Stack(app, 'ComsumeStack', { env: { region: 'ap-northeast-1' } });
      new ssm.StringParameter(consumeStack, 'CertificateId', { stringValue: certificate.certificateRef.certificateId });
      Template.fromStack(consumeStack).hasResourceProperties('AWS::SSM::Parameter', {
        Type: 'String',
        Value: {
          'Fn::GetStackOutput': {
            OutputName: 'PublishOutputRefwwwexamplecomc85417393caaed388127e188e7f631583bbeb265e79386E879B87ADECF',
            Region: 'us-east-1',
            StackName: 'TestStackCertificateStackFBF44F33',
          },
        },
      });
    });
  });
});
