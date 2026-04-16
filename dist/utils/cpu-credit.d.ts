import type * as ec2 from 'aws-cdk-lib/aws-ec2';
/**
 * The number of credits that can be earned in a 24-hour period.
 * @see https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-credits-baseline-concepts.html
 */
export declare const MAXIMUM_CPU_CREDITS: {
    nano: number;
    micro: number;
    small: number;
    medium: number;
    large: number;
    xlarge: number;
    '2xlarge': number;
};
/**
 * The number of credits that can be earned in a 24-hour period.
 * @see https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-credits-baseline-concepts.html
 */
export declare function maximumCpuCredits(instanceType: ec2.InstanceType): number | undefined;
