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
   * A map of hosted zones where DNS records must be created for the domains in the certificate
   * @default - Use `zone`
   */
  readonly zones?: Record<string, route53.IHostedZone>;
  /**
   * The domain name of the certificate
   */
  readonly domainName: string;
  /**
   * Alternative domain names on your certificate.
   * @default - no alternative names
   */
  readonly subjectAlternativeNames?: string[];
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
    let certScope: Construct = this; // eslint-disable-line @typescript-eslint/no-this-alias
    let certId = 'Certificate';
    if (scopeStack.env.region !== 'us-east-1') {
      certScope =
        scopeStack.node.tryFindChild('CertificateStack') ??
        new cdk.Stack(scopeStack, 'CertificateStack', {
          env: { account: scopeStack.account, region: 'us-east-1' },
          crossRegionReferences: true,
        });
      certId = `${props.domainName}:${this.node.addr}`;
    }

    const certificate = new acm.Certificate(certScope, certId, {
      domainName: props.domainName,
      subjectAlternativeNames: props.subjectAlternativeNames,
      validation: props.zones
        ? acm.CertificateValidation.fromDnsMultiZone(props.zones)
        : acm.CertificateValidation.fromDns(props.zone),
      certificateName: props.certificateName ?? this.node.path,
      keyAlgorithm: props.keyAlgorithm,
    });

    this.env = certificate.env;
    this.certificateRef = certificate.certificateRef;
  }
}
