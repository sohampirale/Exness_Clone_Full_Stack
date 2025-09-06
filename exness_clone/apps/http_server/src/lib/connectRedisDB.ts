import { createClient } from "redis";
import { livePrices, updateRedisQueue, updateRediSubscriber } from "../variables/index.js";


export default async function connectRedisDB(){
    let subscriber,redisQueue;
    subscriber = createClient({url:process.env.REDIS_DB_URL!});
    redisQueue=createClient({url:process.env.REDIS_DB_URL!})
    
    await redisQueue.connect();
    await subscriber.connect();

    updateRedisQueue(redisQueue)
    updateRediSubscriber(subscriber)
    console.log('Redis DB connected successfully');
    let cnt=0
    await subscriber.pSubscribe("*", (strData, channel) => {
        const data = JSON.parse(strData)        
        livePrices.set(channel,data)        
    });
    return subscriber
}
