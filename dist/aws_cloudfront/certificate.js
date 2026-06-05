import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';
/**
 * Cross-region ACM certificate (us-east-1) for CloudFront distribution
 */
export class Certificate extends Construct {
    env;
    certificateRef;
    constructor(scope, id, props) {
        super(scope, id);
        const scopeStack = cdk.Stack.of(scope);
        const crossEnv = scopeStack.env.region !== 'us-east-1';
        const certScope = crossEnv ? CertificateStack.lookup(scopeStack) : this;
        const certId = crossEnv ? `${props.domainName}:${this.node.addr}` : 'Certificate';
        const certificate = new acm.Certificate(certScope, certId, {
            domainName: props.domainName,
            subjectAlternativeNames: props.subjectAlternativeNames,
            validation: props.zones
                ? acm.CertificateValidation.fromDnsMultiZone(props.zones)
                : acm.CertificateValidation.fromDns(props.zone),
            certificateName: props.certificateName ?? this.node.path,
            keyAlgorithm: props.keyAlgorithm,
        });
        cdk.CrossStackReferences.of(certificate).produce(cdk.ReferenceStrength.WEAK);
        this.env = certificate.env;
        this.certificateRef = certificate.certificateRef;
    }
}
class CertificateStack extends cdk.Stack {
    static lookup(scope) {
        return scope.node.tryFindChild('CertificateStack') ?? new CertificateStack(scope, 'CertificateStack');
    }
    constructor(scope, id) {
        super(scope, id, { env: { account: scope.account, region: 'us-east-1' }, crossRegionReferences: true });
        cdk.CrossStackReferences.of(this).consume(cdk.ReferenceStrength.WEAK);
    }
}
//# sourceMappingURL=certificate.js.map