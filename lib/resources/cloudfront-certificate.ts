import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import type * as route53 from 'aws-cdk-lib/aws-route53';
import type { Construct } from 'constructs';

/**
 * Properties for CloudFrontCertificate
 */
export interface CloudfrontCertificateProps {
  /**
   * The route53 hosted zone
   * @default - No records will be published
   */
  readonly zone?: route53.IHostedZone;
  /**
   * The domain name of the certificate
   */
  readonly domainName: string;
}

/**
 * Cross-region ACM certificate (us-east-1) for CloudFront distribution
 */
export class CloudfrontCertificate extends cdk.Resource implements acm.ICertificateRef {
  readonly certificateRef: acm.CertificateReference;

  constructor(scope: Construct, id: string, props: CloudfrontCertificateProps) {
    super(scope, id);

    const scopeStack = cdk.Stack.of(scope);
    const stack =
      scopeStack.node.tryFindChild('CertificateStack') ??
      new cdk.Stack(scopeStack, 'CertificateStack', {
        env: { account: scopeStack.account, region: 'us-east-1' },
        crossRegionReferences: true,
      });

    const certificate = new acm.Certificate(stack, `${props.domainName}:${this.node.addr}`, {
      domainName: props.domainName,
      validation: acm.CertificateValidation.fromDns(props.zone),
    });

    this.certificateRef = certificate.certificateRef;
  }
}
