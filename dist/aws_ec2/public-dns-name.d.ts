import * as cdk from 'aws-cdk-lib';
import type * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
interface PublicDnsNameProps {
    readonly networkInterface?: ec2.INetworkInterfaceRef;
    readonly instance?: ec2.IInstanceRef;
    readonly deviceIndex?: string;
    readonly publicIp?: string;
    readonly privateIp?: string;
}
export declare class PublicDnsName extends Construct {
    private resource;
    constructor(scope: Construct, id: string, props: PublicDnsNameProps);
    getResponseField(dataPath: string): string;
    getResponseFieldReference(dataPath: string): cdk.Reference;
    get publicIpv4Address(): string;
    get publicIpv4DnsName(): string;
    get publicIpv6Address(): string;
    get publicIpv6DnsName(): string;
    get publicDualStackDnsName(): string;
}
export {};
