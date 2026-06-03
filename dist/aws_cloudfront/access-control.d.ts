import type { Construct } from 'constructs';
import { Function } from './function.js';
/**
 * Properties for AccessControl
 */
export interface AccessControlProps {
    /**
     * The function name.
     * @default - Automatically generated
     */
    readonly functionName?: string;
    /**
     * The comment of the function.
     * @default - Predefined comment
     */
    readonly comment?: string;
    /**
     * Indicates whether the function will be automatically published.
     * @default true
     */
    readonly autoPublish?: boolean;
    /**
     * The credentials of BASIC authentication.
     * @example ['user:pass']
     * @default - No basic authentication
     */
    readonly basicAuth?: string[];
    /**
     * The IP addresses or CIDRs allowed to access.
     * @example ['198.51.100.0/24', 'fe00:dead:beef::/56']
     * @default - No IP-based access control
     */
    readonly remoteIp?: string[];
    /**
     * Controls whether both BASIC authentication and IP-based are required.
     * @default Satisfy.ALL
     */
    readonly satisfy?: Satisfy;
}
/**
 * The satisfy of access control
 */
export declare enum Satisfy {
    /** Requires either BASIC auth or IP address */
    ANY = "ANY",
    /** Requires both BASIC auth and IP address */
    ALL = "ALL"
}
/**
 * CloudFront Function for access control (BASIC authentication / IP-based access control)
 */
export declare class AccessControl extends Function {
    constructor(scope: Construct, id: string, props: AccessControlProps);
}
