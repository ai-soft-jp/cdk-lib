import * as path from 'node:path';
import * as cdk from 'aws-cdk-lib';
import { lit } from 'aws-cdk-lib/core/lib/helpers-internal';
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
export enum Satisfy {
  /** Requires either BASIC auth or IP address */
  ANY = 'ANY',
  /** Requires both BASIC auth and IP address */
  ALL = 'ALL',
}

type IPVERSION = 4 | 6;

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
      entry: path.resolve(import.meta.dirname, '../../functions/cloudfront/access-control.js'),
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

/**
 * Determine the version of the IP address
 *
 * @param ip IP address
 * @returns `6` for IPv6, `4` otherwise
 */
function ipv(ip: string): IPVERSION {
  return ip.includes(':') ? 6 : 4;
}

/**
 * Convert an IPv4 address to bin
 *
 * @param ip IPv4 address
 * @returns Binary representation of `ip`
 */
function ip4bin(ip: string) {
  return ip
    .split('.')
    .map((component) => (+component).toString(2).padStart(8, '0'))
    .join('');
}

/**
 * Convert an IPv6 address to hex
 *
 * @param ip IPv6 address
 * @returns Binary representation of `ip`
 */
function ip6bin(ip: string) {
  return ip
    .replace(/^::/, '0::')
    .replace(/::$/, '::0')
    .split(':')
    .map((component) => component && parseInt(component, 16).toString(2).padStart(16, '0'))
    .map((component, i, array) => component || '0'.repeat(128 - array.join('').length))
    .join('');
}

/**
 * Convert a regular IPv4/6 address to binary
 *
 * @param ip Regular IPv4/6 address
 * @returns Binary IPv4/6 address
 */
function ip2bin(ip: string) {
  return ip.includes(':') ? ip6bin(ip) : ip4bin(ip);
}

/**
 * Convert CIDR to binary mask
 *
 * @param cidr IPv4/6 CIDR
 * @returns Binary mask
 */
function cidr2bin(cidr: string) {
  const [network, mask] = cidr.split('/');
  return ip2bin(network!).substring(0, +(mask || 128));
}

/**
 * Convert CIDRs to regular expressions
 *
 * @param cidrs CIDRs
 * @returns Regular expressions
 */
function cidrs2pattern(cidrs: readonly string[]) {
  const byver: Record<IPVERSION, string[]> = { 4: [], 6: [] };
  cidrs.forEach((cidr) => byver[ipv(cidr)].push(cidr2bin(cidr)));

  const pattern: Record<IPVERSION, string | null> = { 4: null, 6: null };
  for (const ver of [4, 6] as const) {
    if (!byver[ver].length) continue;

    const re = byver[ver]
      .sort((a, b) => a.length - b.length)
      .reduce<string[]>((carry, cidr) => (carry.some((v) => cidr.startsWith(v)) ? carry : carry.concat(cidr)), [])
      .join('|');
    pattern[ver] = `^(?:${re})`;
  }

  return pattern;
}
