/**
 * The number of credits that can be earned in a 24-hour period.
 * @see https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-credits-baseline-concepts.html
 */
export const MAXIMUM_CPU_CREDITS = {
    nano: 144,
    micro: 288,
    small: 576,
    medium: 576,
    large: 864,
    xlarge: 2304,
    '2xlarge': 4608,
};
/**
 * The number of credits that can be earned in a 24-hour period.
 * @see https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-credits-baseline-concepts.html
 */
export function maximumCpuCredits(instanceType) {
    if (!instanceType.isBurstable())
        return;
    const size = instanceType.toString().split('.').at(-1);
    return MAXIMUM_CPU_CREDITS[size];
}
//# sourceMappingURL=cpu-credit.js.map