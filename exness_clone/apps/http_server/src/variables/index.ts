export const activeUsers:any={}

export const livePrices=new Map()

export let redisSubscriber:any;

export function updateRediSubscriber(subscriber:any){
    redisSubscriber=subscriber
}

//for active SELL orders with margin
export const sellPQS:any={}

export const buyPQS:any={}

export const leverageBuyPQS:any={}

export const leverageSellPQS={}

export const completedBuyOrders:any[]=[]

export const completedSellOrders:any[]=[]

export const completedLeverageBuyOrders:any[]=[]

export const completedLeverageSellOrders:any[]=[]


export const maxLeverageScale=10;