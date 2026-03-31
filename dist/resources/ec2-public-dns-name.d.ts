import type * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
interface Ec2PublicDnsNameProps {
    readonly instance?: ec2.IInstanceRef;
    readonly eip?: ec2.IEIPRef;
}
export declare class Ec2PublicDnsName extends Construct {
    readonly publicIpv4DnsName: string;
    readonly publicIpv6DnsName: string;
    readonly publicDualStackDnsName: string;
    constructor(scope: Construct, id: string, props: Ec2PublicDnsNameProps);
}
export {};
