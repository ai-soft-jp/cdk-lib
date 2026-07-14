import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as ais from '../../lib';

describe('DistributionRecords', () => {
  let stack: cdk.Stack;
  let zone: route53.HostedZone;
  beforeEach(() => {
    stack = new cdk.Stack();
    zone = new route53.HostedZone(stack, 'HostedZone', { zoneName: 'example.com' });
  });

  test('defines A/AAAA/HTTPS/MX/SPF records by default', () => {
    const distribution = new cloudfront.Distribution(stack, 'Distribution', {
      defaultBehavior: { origin: new origins.HttpOrigin('example.aws') },
    });
    new ais.cloudfront.DistributionRecords(stack, 'Records', { zone, recordName: 'www', distribution });

    Template.fromStack(stack).hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'A',
      Name: 'www.example.com.',
      AliasTarget: { DNSName: stack.resolve(distribution.distributionDomainName) },
    });
    Template.fromStack(stack).hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'AAAA',
      Name: 'www.example.com.',
      AliasTarget: { DNSName: stack.resolve(distribution.distributionDomainName) },
    });
    Template.fromStack(stack).hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'HTTPS',
      Name: 'www.example.com.',
      AliasTarget: { DNSName: stack.resolve(distribution.distributionDomainName) },
    });
    Template.fromStack(stack).hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'MX',
      Name: 'www.example.com.',
      ResourceRecords: ['0 .'],
    });
    Template.fromStack(stack).hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'TXT',
      Name: 'www.example.com.',
      ResourceRecords: ['"v=spf1 -all"'],
    });
  });

  test('defines records with weight', () => {
    const distribution = new cloudfront.Distribution(stack, 'Distribution', {
      defaultBehavior: { origin: new origins.HttpOrigin('example.aws') },
    });
    new ais.cloudfront.DistributionRecords(stack, 'Records', { zone, recordName: 'www', distribution, weight: 1 });

    Template.fromStack(stack).hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'A',
      Name: 'www.example.com.',
      AliasTarget: { DNSName: stack.resolve(distribution.distributionDomainName) },
      Weight: 1,
    });
    Template.fromStack(stack).hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'AAAA',
      Name: 'www.example.com.',
      AliasTarget: { DNSName: stack.resolve(distribution.distributionDomainName) },
      Weight: 1,
    });
    Template.fromStack(stack).hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'HTTPS',
      Name: 'www.example.com.',
      AliasTarget: { DNSName: stack.resolve(distribution.distributionDomainName) },
      Weight: 1,
    });
    Template.fromStack(stack).hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'MX',
      Name: 'www.example.com.',
      ResourceRecords: ['0 .'],
      Weight: 1,
    });
    Template.fromStack(stack).hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'TXT',
      Name: 'www.example.com.',
      ResourceRecords: ['"v=spf1 -all"'],
      Weight: 1,
    });
  });

  test('defines IPv4 only records', () => {
    const distribution = new cloudfront.Distribution(stack, 'Distribution', {
      defaultBehavior: { origin: new origins.HttpOrigin('example.aws') },
    });
    new ais.cloudfront.DistributionRecords(stack, 'Records', {
      zone,
      recordName: 'www',
      distribution,
      ipAddressType: ais.cloudfront.IpAddressType.IPV4_ONLY,
    });

    Template.fromStack(stack).hasResourceProperties('AWS::Route53::RecordSet', { Type: 'A' });
    expect(Template.fromStack(stack).findResources('AWS::Route53::RecordSet', { Type: 'AAAA' })).toStrictEqual({});
  });

  test('defines IPv6 only records', () => {
    const distribution = new cloudfront.Distribution(stack, 'Distribution', {
      defaultBehavior: { origin: new origins.HttpOrigin('example.aws') },
    });
    new ais.cloudfront.DistributionRecords(stack, 'Records', {
      zone,
      recordName: 'www',
      distribution,
      ipAddressType: ais.cloudfront.IpAddressType.IPV6_ONLY,
    });

    Template.fromStack(stack).hasResourceProperties('AWS::Route53::RecordSet', { Type: 'AAAA' });
    expect(Template.fromStack(stack).findResources('AWS::Route53::RecordSet', { Type: 'A' })).toStrictEqual({});
  });

  test('defines records without HTTPS', () => {
    const distribution = new cloudfront.Distribution(stack, 'Distribution', {
      defaultBehavior: { origin: new origins.HttpOrigin('example.aws') },
    });
    new ais.cloudfront.DistributionRecords(stack, 'Records', {
      zone,
      recordName: 'www',
      distribution,
      httpsRecord: false,
    });

    Template.fromStack(stack).hasResourceProperties('AWS::Route53::RecordSet', { Type: 'A' });
    Template.fromStack(stack).hasResourceProperties('AWS::Route53::RecordSet', { Type: 'AAAA' });
    expect(Template.fromStack(stack).findResources('AWS::Route53::RecordSet', { Type: 'HTTPS' })).toStrictEqual({});
  });

  test('defines records without MX/SPF', () => {
    const distribution = new cloudfront.Distribution(stack, 'Distribution', {
      defaultBehavior: { origin: new origins.HttpOrigin('example.aws') },
    });
    new ais.cloudfront.DistributionRecords(stack, 'Records', {
      zone,
      recordName: 'www',
      distribution,
      mxRecord: false,
    });

    Template.fromStack(stack).hasResourceProperties('AWS::Route53::RecordSet', { Type: 'A' });
    Template.fromStack(stack).hasResourceProperties('AWS::Route53::RecordSet', { Type: 'AAAA' });
    Template.fromStack(stack).hasResourceProperties('AWS::Route53::RecordSet', { Type: 'HTTPS' });
    expect(Template.fromStack(stack).findResources('AWS::Route53::RecordSet', { Type: 'MX' })).toStrictEqual({});
    expect(Template.fromStack(stack).findResources('AWS::Route53::RecordSet', { Type: 'TXT' })).toStrictEqual({});
  });
});
