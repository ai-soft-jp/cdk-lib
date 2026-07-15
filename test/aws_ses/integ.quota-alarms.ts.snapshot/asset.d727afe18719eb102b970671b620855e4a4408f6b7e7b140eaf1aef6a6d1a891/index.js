"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_sesv2_1 = require("@aws-sdk/client-sesv2");
const ses = new client_sesv2_1.SESv2Client();
const handler = async () => {
    const res = await ses.send(new client_sesv2_1.GetAccountCommand({}));
    const { Max24HourSend, MaxSendRate } = res.SendQuota;
    return {
        Data: {
            Max24HourSend: Max24HourSend,
            Max24HourSendThreshold: Max24HourSend * 0.8,
            MaxSendRate: MaxSendRate,
            MaxSendRateThreshold: MaxSendRate * 0.9 * 60 * 5,
        },
    };
};
exports.handler = handler;
//# sourceMappingURL=index.js.map