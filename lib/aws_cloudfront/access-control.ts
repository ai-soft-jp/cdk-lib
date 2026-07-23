import * as path from 'node:path';
import * as cdk from 'aws-cdk-lib';
import type * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { lit } from 'aws-cdk-lib/core/lib/helpers-internal';
import type { Construct } from 'constructs';
import { cidrs2pattern } from '../utils/ipaddress';
import { Function } from './function';

/**
 * Properties for AccessControl
 */
export interface AccessControlProps extends Pick<cloudfront.FunctionProps, 'functionName' | 'comment' | 'autoPublish'> {
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
  /**
   * The response HTML for 403 Forbidden.
   * @default - Predefined HTML for 403 Forbidden
   */
  readonly forbiddenHtml?: string;
  /**
   * The response HTML for 401 Unauthorized.
   * @default - Predefined HTML for 401 Unauthorized
   */
  readonly unauthorizedHtml?: string;
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
      define: {
        __BASIC_AUTH: basicAuth,
        __REMOTE_IP: remoteIp,
        __SATISFY: satisfy,
        FORBIDDEN_HTML: props.forbiddenHtml ?? httpErrorPage('403 Forbidden'),
        UNAUTHORIZED_HTML: props.unauthorizedHtml ?? httpErrorPage('401 Unauthorized'),
      },
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

function httpErrorPage(status: string) {
  let mesg = `<html>\n<head><title>${status}</title></head>\n<body>\n<center><h1>${status}</h1></center>\n</body>\n</html>\n`;
  for (let i = 0; i < 6; ++i) mesg += '<!-- a padding to disable MSIE and Chrome friendly error page -->\n';
  return mesg;
}
