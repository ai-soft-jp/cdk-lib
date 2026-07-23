import * as fs from 'node:fs';
import * as path from 'node:path';
import findUp from 'find-up';

export function lookupPackageVersion(packageName: string) {
  return lookupPackageVersionInternal(require.resolve(packageName), packageName);
}

export function lookupPackageVersionInternal(cwd: string, packageName: string) {
  let version: string | undefined = undefined;
  findUp.sync((dir) => (version = getPackageVersion(dir, packageName)) && findUp.stop, { cwd });
  return version;
}

export function getPackageVersion(dir: string, packageName: string): string | undefined {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), { encoding: 'utf8' }));
    if (packageJson.name === packageName && packageJson.version) return packageJson.version;
  } catch (_err) {
    // ignore
  }
}
