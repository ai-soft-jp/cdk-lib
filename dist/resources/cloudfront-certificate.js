import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
/**
 * Cross-region ACM certificate (us-east-1) for CloudFront distribution
 */
export class CloudfrontCertificate extends cdk.Resource {
    certificateRef;
    constructor(scope, id, props) {
        super(scope, id);
        const scopeStack = cdk.Stack.of(scope);
        const stack = scopeStack.node.tryFindChild('CertificateStack') ??
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
//# sourceMappingURL=cloudfront-certificate.js.map