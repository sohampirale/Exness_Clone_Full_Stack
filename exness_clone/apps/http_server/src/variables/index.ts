export const activeUsers:any={}

export const livePrices=new Map()

export let redisSubscriber:any;

export function updateRediSubscriber(subscriber:any){
    redisSubscriber=subscriber
}

export const reqSymbols=['BTCUSDT','SOLUSDT']

//for active SELL orders with margin
export const sellPQS={}

export const buyPQS={}