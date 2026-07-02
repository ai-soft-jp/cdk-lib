export type IPVERSION = 4 | 6;

/**
 * Determine the version of the IP address
 *
 * @param ip IP address
 * @returns `6` for IPv6, `4` otherwise
 */
export function ipv(ip: string): IPVERSION {
  return ip.includes(':') ? 6 : 4;
}

/**
 * Convert an IPv4 address to bin
 *
 * @param ip IPv4 address
 * @returns Binary representation of `ip`
 */
export function ip4bin(ip: string) {
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
export function ip6bin(ip: string) {
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
export function ip2bin(ip: string) {
  return ip.includes(':') ? ip6bin(ip) : ip4bin(ip);
}

/**
 * Convert CIDR to binary mask
 *
 * @param cidr IPv4/6 CIDR
 * @returns Binary mask
 */
export function cidr2bin(cidr: string) {
  const [network, mask] = cidr.split('/');
  return ip2bin(network!).substring(0, +(mask || 128));
}

/**
 * Convert CIDRs to regular expressions
 *
 * @param cidrs CIDRs
 * @returns Regular expressions
 */
export function cidrs2pattern(cidrs: readonly string[]) {
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
