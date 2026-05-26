import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';
/**
 * Cross-region ACM certificate (us-east-1) for CloudFront distribution
 */
export class CloudfrontCertificate extends Construct {
    env;
    certificateRef;
    constructor(scope, id, props) {
        super(scope, id);
        const scopeStack = cdk.Stack.of(scope);
        let certScope = this; // eslint-disable-line @typescript-eslint/no-this-alias
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
//# sourceMappingURL=cloudfront-certificate.js.map