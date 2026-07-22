import * as fs from 'node:fs';
import * as path from 'node:path';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { lit } from 'aws-cdk-lib/core/lib/helpers-internal';
import type { Construct } from 'constructs';
import * as semver from 'semver';

export interface ChromiumLayerProps {
  /**
   * The version of @sparticuz/chromium package
   * @default - automatically detected
   */
  readonly version?: string;
  /**
   * The architecture of Chromium Layer
   * @default arm64
   */
  readonly architecture?: lambda.Architecture;
}

export class ChromiumLayer extends lambda.LayerVersion {
  readonly architecture: lambda.Architecture;
  readonly chromiumVersion: string;

  public static of(scope: Construct, props?: ChromiumLayerProps): lambda.LayerVersion {
    let id = 'ChromiumLayer';
    if (props?.architecture) id += `-${props.architecture.name}`;
    const layer = (cdk.Stack.of(scope).node.tryFindChild(id) as ChromiumLayer) ?? new ChromiumLayer(scope, id, props);

    if (props?.version && layer.chromiumVersion !== props.version) {
      throw new cdk.ValidationError(
        lit`ChromiumVersionConflict`,
        `The specified version ${props.version} conflicts already construted version ${layer.chromiumVersion}`,
        scope,
      );
    }
    return layer;
  }

  constructor(scope: Construct, id: string, props?: ChromiumLayerProps) {
    const version = props?.version ?? getChromiumVersion();
    const arch = props?.architecture ?? lambda.Architecture.ARM_64;
    const zipname = `chromium-v${version}-layer.${getArchitecture(arch)}.zip`;
    const assetPath = path.join(cdk.Stage.of(scope)!.assetOutdir, zipname);
    const url = `https://github.com/Sparticuz/chromium/releases/download/v${version}/${zipname}`;

    if (!semver.satisfies(version, '>= 137.0.0')) {
      throw new cdk.UnscopedValidationError(
        lit`ChromiumVersionIncompatible`,
        `Incompatible @sparticuz/chromium version (requires >=137.0.0), got ${version}`,
      );
    }

    super(scope, id, {
      layerVersionName: `${cdk.Stack.of(scope).stackName}-ChromeLayer-${arch}`,
      description: `@sparticuz/chromium v${version} (${arch.name})`,
      compatibleArchitectures: [arch],
      compatibleRuntimes: [lambda.Runtime.NODEJS_22_X, lambda.Runtime.NODEJS_24_X],
      code: lambda.Code.fromCustomCommand(assetPath, ['curl', '-f', '-L', url, '-z', assetPath, '-o', assetPath]),
    });

    this.architecture = arch;
    this.chromiumVersion = version;
  }
}

function getChromiumVersion(): string {
  let dir = path.resolve(require.resolve('@sparticuz/chromium'));
  let version: string | undefined = undefined;
  while (dir !== '/' && !(version = getPackageVersion(dir))) {
    dir = path.dirname(dir);
  }
  if (!version) {
    throw new cdk.UnscopedValidationError(
      lit`ChromiumVersionNotFound`,
      'Cannot determine the version of @sparticuz/chromium package',
    );
  }
  return version;
}

function getPackageVersion(dir: string): string | undefined {
  const fname = path.join(dir, 'package.json');
  try {
    const packageJson = JSON.parse(fs.readFileSync(fname, { encoding: 'utf8' }));
    if (packageJson.name === '@sparticuz/chromium' && packageJson.version) return packageJson.version;
  } catch (_err) {
    // ignore
  }
}

function getArchitecture(arch: lambda.Architecture) {
  switch (arch) {
    case lambda.Architecture.X86_64:
      return 'x64';
    case lambda.Architecture.ARM_64:
      return 'arm64';
    default:
      throw new cdk.UnscopedValidationError(
        lit`InvalidArchitecture`,
        `The architecture must be x64 or arm, got ${arch.name}`,
      );
  }
}
