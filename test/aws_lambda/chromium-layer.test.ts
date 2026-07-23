import child_process from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ais from '../../lib';
import { lookupPackageVersionInternal } from '../../lib/private/package-version';

describe('ChromiumLayer', () => {
  let stack: cdk.Stack;
  let tmpdir: string | undefined;
  beforeEach(() => {
    stack = new cdk.Stack();
    tmpdir = undefined;
    // mock spawnSync (called from lambda.Code.fromCustomCommand) not to download actual layer zip
    jest.spyOn(child_process, 'spawnSync').mockImplementation((...args) => {
      const index = args[1]?.findIndex((s) => s === '-o') ?? -1;
      if (index < 0) throw new Error(`Unexpected spawnSync; args=${JSON.stringify(args)}`);
      fs.writeFileSync(args[1]![index + 1]!, '');
      return {
        status: 0,
        stderr: Buffer.from('stderr'),
        stdout: Buffer.from('stdout'),
        pid: 123,
        output: ['stdout', 'stderr'],
        signal: null,
      };
    });
  });
  afterEach(() => {
    if (tmpdir) fs.rmSync(tmpdir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  test('constructs defaults', () => {
    const layer = ais.lambda.ChromiumLayer.of(stack);
    expect(layer.node.id).toEqual('ChromiumLayer');
    Template.fromStack(stack).hasResourceProperties('AWS::Lambda::LayerVersion', {
      LayerName: 'Default-ChromeLayer-arm64',
      CompatibleArchitectures: ['arm64'],
    });
  });

  test('constructs with specific version', () => {
    const layer = ais.lambda.ChromiumLayer.of(stack, { version: '200.0.0' });
    expect(layer.node.id).toEqual('ChromiumLayer');
    Template.fromStack(stack).hasResourceProperties('AWS::Lambda::LayerVersion', {
      Description: '@sparticuz/chromium v200.0.0 (arm64)',
    });
  });

  test('throws when incompatible version', () => {
    expect(() => {
      ais.lambda.ChromiumLayer.of(stack, { version: '136.0.0' });
    }).toThrow('Incompatible @sparticuz/chromium version');
  });

  test('throws when specified version conflicts', () => {
    ais.lambda.ChromiumLayer.of(stack, { version: '148.0.0' });
    expect(() => {
      ais.lambda.ChromiumLayer.of(stack, { version: '149.0.0' });
    }).toThrow('The specified version 149.0.0 conflicts');
  });

  test('constructs x86_64', () => {
    const layer = ais.lambda.ChromiumLayer.of(stack, { architecture: lambda.Architecture.X86_64 });
    expect(layer.node.id).toEqual('ChromiumLayer-x86_64');
    Template.fromStack(stack).hasResourceProperties('AWS::Lambda::LayerVersion', {
      LayerName: 'Default-ChromeLayer-x86_64',
      CompatibleArchitectures: ['x86_64'],
    });
  });

  test('constructs arm64', () => {
    const layer = ais.lambda.ChromiumLayer.of(stack, { architecture: lambda.Architecture.ARM_64 });
    expect(layer.node.id).toEqual('ChromiumLayer-arm64');
    Template.fromStack(stack).hasResourceProperties('AWS::Lambda::LayerVersion', {
      LayerName: 'Default-ChromeLayer-arm64',
      CompatibleArchitectures: ['arm64'],
    });
  });

  test('of() returns singleton', () => {
    const stack2 = new cdk.Stack();
    const layer = ais.lambda.ChromiumLayer.of(stack);
    const layer_dup = ais.lambda.ChromiumLayer.of(stack);
    const layer_stack2 = ais.lambda.ChromiumLayer.of(stack2);
    expect(layer_dup).toBe(layer);
    expect(layer_stack2).not.toBe(layer);
  });

  test('lookupPackageName', () => {
    tmpdir = fs.mkdtempSync(path.resolve(os.tmpdir(), 'jest'));
    const packageDir = path.join(tmpdir, 'a/b/c');
    fs.mkdirSync(packageDir, { recursive: true });
    fs.writeFileSync(path.join(packageDir, 'package.json'), JSON.stringify({ type: 'commonjs' }));
    fs.writeFileSync(path.join(tmpdir, 'a/b', 'package.json'), JSON.stringify({ version: '3.3.4' }));
    fs.writeFileSync(path.join(tmpdir, 'a', 'package.json'), JSON.stringify({ name: 'skn' }));
    fs.writeFileSync(path.join(tmpdir, 'package.json'), JSON.stringify({ name: '@dead/beef', version: '44.5' }));
    expect(lookupPackageVersionInternal(packageDir, '@dead/beef')).toEqual('44.5');
  });
});
