import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
/**
 * CloudWatch alarm event type
 */
export var AlarmEventType;
(function (AlarmEventType) {
    /** OK */
    AlarmEventType["Ok"] = "Ok";
    /** ALARM */
    AlarmEventType["Alarm"] = "Alarm";
    /** INSUFFICIENT_DATA */
    AlarmEventType["InsufficientData"] = "InsufficientData";
})(AlarmEventType || (AlarmEventType = {}));
/**
 * Applies alarm actions to descending CloudWatch alarms
 */
export class AlarmActions {
    scope;
    /**
     * Returns AlarmActions aspect of the specified node
     */
    static of(scope) {
        return new AlarmActions(scope);
    }
    constructor(scope) {
        this.scope = scope;
    }
    /**
     * Applies alarm actions
     * @param eventTypes The alarm event types
     */
    apply(eventTypes, props) {
        cdk.Aspects.of(this.scope).add(new AlarmActionAspect(eventTypes, props), {
            priority: props.priority ?? cdk.AspectPriority.MUTATING,
        });
    }
    /**
     * Applies OK action
     */
    ok(props) {
        this.apply([AlarmEventType.Ok], props);
    }
    /**
     * Applies ALARM action
     */
    alarm(props) {
        this.apply([AlarmEventType.Alarm], props);
    }
    /**
     * Applies INSUFFICIENT_DATA action
     */
    insufficientData(props) {
        this.apply([AlarmEventType.InsufficientData], props);
    }
}
class AlarmActionAspect {
    eventTypes;
    props;
    constructor(eventTypes, props) {
        this.eventTypes = eventTypes;
        this.props = props;
    }
    visit(node) {
        if (!isAlarm(node))
            return;
        for (const eventType of this.eventTypes) {
            node[`add${eventType}Action`](...this.props.actions);
        }
    }
}
function isAlarm(node) {
    return (cdk.Resource.isResource(node) &&
        Object.getPrototypeOf(node).constructor?.PROPERTY_INJECTION_ID === cloudwatch.Alarm.PROPERTY_INJECTION_ID);
}
//# sourceMappingURL=alarm-action.js.map