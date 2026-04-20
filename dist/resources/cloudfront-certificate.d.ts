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
export declare class CloudfrontCertificate extends Construct implements acm.ICertificateRef {
    readonly env: cdk.interfaces.ResourceEnvironment;
    readonly certificateRef: acm.CertificateReference;
    constructor(scope: Construct, id: string, props: CloudfrontCertificateProps);
}
