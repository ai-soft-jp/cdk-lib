import * as path from 'node:path';
import * as cdk from 'aws-cdk-lib';
import { lit } from 'aws-cdk-lib/core/lib/helpers-internal';
import type { Construct } from 'constructs';
import { cidrs2pattern } from '../utils/ipaddress';
import { Function } from './function';

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
export enum Satisfy {
  /** Requires either BASIC auth or IP address */
  ANY = 'ANY',
  /** Requires both BASIC auth and IP address */
  ALL = 'ALL',
}

/**
 * CloudFront Function for access control (BASIC authentication / IP-based access control)
 */
export class AccessControl extends Function {
  constructor(scope: Construct, id: string, props: AccessControlProps) {
    const basicAuth = props.basicAuth?.length
      ? props.basicAuth.map((auth) => Buffer.from(auth).toString('base64'))
      : null;
    const remoteIp = props.remoteIp?.length ? cidrs2pattern(props.remoteIp) : null;
    const satisfy = props.satisfy ?? Satisfy.ALL;

    super(scope, id, {
      entry: path.resolve(__dirname, '../../functions/cloudfront/access-control.js'),
      define: { __BASIC_AUTH: basicAuth, __REMOTE_IP: remoteIp, __SATISFY: satisfy },
      functionName: props.functionName,
      comment: props.comment ?? `[${scope.node.path}/${id}] CloudFront Access Control`,
      autoPublish: props.autoPublish ?? true,
    });

    if (!(basicAuth || remoteIp)) {
      throw new cdk.ValidationError(
        lit`AccessControlRequired`,
        'The basicAuth or the remoteIp must be specified either or both.',
        this,
      );
    }
  }
}
