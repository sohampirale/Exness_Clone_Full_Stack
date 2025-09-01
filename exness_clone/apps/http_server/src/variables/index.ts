export const activeUsers:any={}

export const livePrices=new Map()

export let redisSubscriber:any;

export function updateRediSubscriber(subscriber:any){
    redisSubscriber=subscriber
}