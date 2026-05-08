import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import type * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

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
  /**
   * The Certificate name.
   * @default - absolute path of this construct
   */
  readonly certificateName?: string;
  /**
   * Specifies the algorithm of the public and private key pair that your certificate uses to encrypt data.
   * @default KeyAlgorithm.RSA_2048
   */
  readonly keyAlgorithm?: acm.KeyAlgorithm;
}

/**
 * Cross-region ACM certificate (us-east-1) for CloudFront distribution
 */
export class CloudfrontCertificate extends Construct implements acm.ICertificateRef {
  readonly env: cdk.interfaces.ResourceEnvironment;
  readonly certificateRef: acm.CertificateReference;

  constructor(scope: Construct, id: string, props: CloudfrontCertificateProps) {
    super(scope, id);

    const scopeStack = cdk.Stack.of(scope);
    let certificate;
    if (scopeStack.env.region === 'us-east-1') {
      certificate = new acm.Certificate(this, 'Certificate', {
        domainName: props.domainName,
        validation: acm.CertificateValidation.fromDns(props.zone),
        certificateName: props.certificateName ?? this.node.path,
        keyAlgorithm: props.keyAlgorithm,
      });
    } else {
      const stack =
        scopeStack.node.tryFindChild('CertificateStack') ??
        new cdk.Stack(scopeStack, 'CertificateStack', {
          env: { account: scopeStack.account, region: 'us-east-1' },
          crossRegionReferences: true,
        });
      certificate = new acm.Certificate(stack, `${props.domainName}:${this.node.addr}`, {
        domainName: props.domainName,
        validation: acm.CertificateValidation.fromDns(props.zone),
        certificateName: props.certificateName ?? this.node.path,
        keyAlgorithm: props.keyAlgorithm,
      });
    }

    this.env = certificate.env;
    this.certificateRef = certificate.certificateRef;
  }
}
