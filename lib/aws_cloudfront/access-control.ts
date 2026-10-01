import * as path from 'node:path';
import * as cdk from 'aws-cdk-lib';
import type * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { lit } from 'aws-cdk-lib/core/lib/helpers-internal';
import type { Construct } from 'constructs';
import { makeRe } from 'minimatch';
import { cidrs2pattern } from '../utils/ipaddress';
import { Function } from './function';

/**
 * Properties for AccessControl
 */
export interface AccessControlProps
  extends Pick<cloudfront.FunctionProps, 'functionName' | 'comment' | 'autoPublish'>, AccessControlOptions {
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
  /**
   * Per-path access control
   * @default - Restrict entirely
   */
  readonly paths?: AccessControlPathOptions[];
}

/**
 * Options of access control
 */
export interface AccessControlOptions {
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
 * Path options of access control
 */
export interface AccessControlPathOptions extends AccessControlOptions {
  /**
   * The wildcard path to apply this options.
   */
  readonly path: string;
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
    const rootOptions = formatOptions(props);
    const pathsOptions = props.paths?.length ? props.paths.map(makePathOptions) : [];
    if (rootOptions) {
      pathsOptions.push(['^/', rootOptions]);
    }

    super(scope, id, {
      entry: path.resolve(__dirname, '../../functions/cloudfront/access-control.js'),
      define: {
        PATHS: pathsOptions,
        FORBIDDEN_HTML: props.forbiddenHtml ?? httpErrorPage('403 Forbidden'),
        UNAUTHORIZED_HTML: props.unauthorizedHtml ?? httpErrorPage('401 Unauthorized'),
      },
      functionName: props.functionName,
      comment: props.comment ?? `[${scope.node.path}/${id}] CloudFront Access Control`,
      autoPublish: props.autoPublish ?? true,
    });

    if (pathsOptions.length === 0) {
      throw new cdk.ValidationError(lit`AccessControlRequired`, 'The access control options must be specified.', this);
    }
  }
}

function httpErrorPage(status: string) {
  let mesg = `<html>\n<head><title>${status}</title></head>\n<body>\n<center><h1>${status}</h1></center>\n</body>\n</html>\n`;
  for (let i = 0; i < 6; ++i) mesg += '<!-- a padding to disable MSIE and Chrome friendly error page -->\n';
  return mesg;
}

function makePathOptions(options: AccessControlPathOptions) {
  const re = makeRe(options.path, { dot: true });
  if (!re) throw new cdk.UnscopedValidationError(lit`InvalidPath`, 'The key of paths cannot be empty.');
  return [re.source, formatOptions(options)] as const;
}

function formatOptions(options: AccessControlOptions) {
  const basicAuth = options.basicAuth?.length
    ? options.basicAuth.map((auth) => Buffer.from(auth).toString('base64'))
    : null;
  const remoteIp = options.remoteIp?.length ? cidrs2pattern(options.remoteIp) : null;
  const satisfy = options.satisfy ?? Satisfy.ALL;

  return basicAuth || remoteIp ? { basicAuth, remoteIp, satisfy } : null;
}
