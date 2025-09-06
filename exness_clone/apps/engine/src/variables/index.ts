export let activeUsers:any={}

export function setActiveUsers(newActiveUsers:any){
    activeUsers=newActiveUsers
}

export const livePrices=new Map()

export let redisQueue:any;

export function updateRedisQueue(redisConn:any){
    redisQueue=redisConn
}

export let redisSubscriber:any;

export function updateRediSubscriber(subscriber:any){
    redisSubscriber=subscriber
}

export let offset=0;

export function setOffset(newOffset:any){
    offset=newOffset
}

//for active SELL orders with margin
export const sellPQS:any={}

export const buyPQS:any={}

export const leverageBuyPQS:any={}

export const leverageSellPQS:any={}

export const completedBuyOrders:any[]=[]

export const completedSellOrders:any[]=[]

export const completedLeverageBuyOrders:any[]=[]

export const completedLeverageSellOrders:any[]=[]

export const maxLeverageScale=10;

export const snapshotDumpInterval = 15000; //TODO replace with 1000*60*5 //5 mins 