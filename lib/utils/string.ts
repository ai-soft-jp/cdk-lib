import * as cdk from 'aws-cdk-lib';

export function clampString(str: string, maxLength: number): string {
  if (cdk.Token.isUnresolved(str)) return str;
  if (str.length > maxLength) return str.slice(0, maxLength - 3) + '...';
  return str;
}
