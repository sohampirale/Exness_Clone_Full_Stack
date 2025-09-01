import { createClient } from "redis";
import { livePrices } from "../variables/index.js";


export default async function connectRedisDB(){
    let subscriber;
    subscriber = createClient({url:process.env.REDIS_DB_URL!});
    await subscriber.connect();
    console.log('Redis DB connected successfully');
    let cnt=0
    await subscriber.pSubscribe("*", (strData, channel) => {
        const data = JSON.parse(strData)        
        livePrices.set(channel,data)        
    });
    return subscriber
}
