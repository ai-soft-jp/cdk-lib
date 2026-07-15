import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ais from '../../lib';

describe('EC2 CPU Credit', () => {
  describe('maximumCpuCredits', () => {
    test('returns undefined for non-burstable instance types', () => {
      const instanceType = ec2.InstanceType.of(ec2.InstanceClass.C8G, ec2.InstanceSize.LARGE);
      expect(ais.ec2.maximumCpuCredits(instanceType)).toBeUndefined();
    });

    // @see https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-credits-baseline-concepts.html
    test.each([
      [ec2.InstanceSize.NANO, 144],
      [ec2.InstanceSize.MICRO, 288],
      [ec2.InstanceSize.SMALL, 576],
      [ec2.InstanceSize.MEDIUM, 576],
      [ec2.InstanceSize.LARGE, 864],
      [ec2.InstanceSize.XLARGE, 2304],
      [ec2.InstanceSize.XLARGE2, 4608],
    ])('returns the correct maximum CPU credits for t4g.%s', (size, max) => {
      const instanceType = ec2.InstanceType.of(ec2.InstanceClass.T4G, size);
      expect(ais.ec2.maximumCpuCredits(instanceType)).toEqual(max);
    });
  });
});
