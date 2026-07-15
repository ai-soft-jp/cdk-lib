import * as ais from '../../lib';

describe('ipaddress', () => {
  test('ipv', () => {
    expect(ais.utils.ipv('127.0.0.1')).toEqual(4);
    expect(ais.utils.ipv('2001:dba::1')).toEqual(6);
  });

  test('ip2bin', () => {
    expect(ais.utils.ip2bin('127.0.0.1')).toEqual('01111111000000000000000000000001');
    expect(ais.utils.ip2bin('2001:dba::1')).toEqual(
      '0010000000000001000011011011101000000000000000000000000000000000' +
        '0000000000000000000000000000000000000000000000000000000000000001',
    );
  });

  test('cidr2bin', () => {
    expect(ais.utils.cidr2bin('10.0.0.0/16')).toEqual('0000101000000000');
    expect(ais.utils.cidr2bin('2001:dba::/56')).toEqual('00100000000000010000110110111010000000000000000000000000');
  });

  test('cidrs2pattern', () => {
    expect(ais.utils.cidrs2pattern(['10.0.0.0/16', '2001:dba::/56'])).toMatchObject({
      4: '^(?:0000101000000000)',
      6: '^(?:00100000000000010000110110111010000000000000000000000000)',
    });
  });
});
