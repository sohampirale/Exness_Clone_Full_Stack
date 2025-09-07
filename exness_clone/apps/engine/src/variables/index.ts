export let activeUsers: any = {}

export function setActiveUsers(newActiveUsers: any) {
    activeUsers = newActiveUsers
}

export const livePrices = new Map()

export let redisQueue: any;

export function updateRedisQueue(redisConn: any) {
    redisQueue = redisConn
}

export let redisSubscriber: any;

export function updateRediSubscriber(subscriber: any) {
    redisSubscriber = subscriber
}

export let offset = -1;

export function setOffset(newOffset: any) {
    offset = newOffset
}

//for active SELL orders with margin
export const sellPQS: any = {}

export const buyPQS: any = {}

export const leverageBuyPQS: any = {}

export const leverageSellPQS: any = {}

export const completedBuyOrders: any[] = []

export const completedSellOrders: any[] = []

export const completedLeverageBuyOrders: any[] = []

export const completedLeverageSellOrders: any[] = []

export const maxLeverageScale = 10;

export const snapshotDumpInterval = 15000; //TODO replace with 1000*60*5 //5 mins 

export const NOTIFICATION_MESSAGE = {
    INSUFFICIENT_BALANCE: `You have insufficient balance to open this order`,
    LIVE_DATA_NOT_FOUND: `Live data not found for symbol requested by you`,
    SUCCESS_OPEN_ORDER: `Your order has been placed successfully`,
    SUCCESS_CLOSE_ORDER: `Your order has been closed successfully`,
    INVALID_MARGIN: `Invalid margin specified`,
    INVALID_ACTION_TYPE: `Invalid action type specific,supported actions "BUY" or "SELL" Only`,
    ORDER_FAILED: `your order has failed`,
    INVALID_DATA: `Invalid/Incorrect data provided`,
    AUTO_LIQUIDATED: `You order isn't active anymore, order might have auto liquidated`,
    WALLET_NOT_FOUND: `Wallet of the user not found`,
    INVALID_LEVERAGE:`Requested leverage exceeds maximum limit`,
    INVALID_STOPLOSS:`Stoploss given by you drops below the margin coverage limit,increase stoploss or increase margin`,
    INVALID_STOPPRICE:`Stopprice given by you excceed the margin coverage limit,decrease stopprice or increase margin`
}

export const NOTIFICATION_BODY = {
    INSUFFICIENT_BALANCE: (username: string, message: string, order: any) => `
        Dear ${username ?? "User"},

        ${message},
        
        order details : ${JSON.stringify(order)},
        Thank you`,

    LIVE_DATA_NOT_FOUND: (username: string, message: string, order: any) => `
        Dear ${username ?? "user"},
        ${message},

        order details : ${JSON.stringify(order)},

        Thank you
        `,
    SUCCESS_OPEN_ORDER: (username: string, message: string, order: any) => `
    Dear ${username ?? "user"},
    ${message},

    order details : ${JSON.stringify(order)},

    Thank you
    `,
    SUCCESS_CLOSE_ORDER: (username: string, message: string, order: any) => `
    Dear ${username ?? "user"},
    ${message},

    order details : ${JSON.stringify(order)},

    Thank you
    `,
    ORDER_FAILED: (username: string, message: string, order: any) => `
    Dear ${username ?? "user"},
    ${message},

    order details : ${JSON.stringify(order)},

    Thank you
    `,

}

export const NOTIFICATION_SUBJECT = {
    INSUFFICIENT_BALANCE: `Exness clone : order failed insufficient balance`,
    LIVE_DATA_NOT_FOUND: `Exness clone : order failed  unsupported asset requested`,
    SUCCESS_OPEN_ORDER: `Exness clone : order placed successfully!`,
    SUCCESS_CLOSE_ORDER: `Exness clone : order closed successfully!`,
    ORDER_FAILED: `Exness clone : order failed after 3 retries`
}