import { createClient } from "redis";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient()
import cron from "node-cron"
const completedOrdersSubscriber  = createClient({ url: process.env.REDIS_DB_URL });
const worker = createClient({ url: process.env.REDIS_DB_URL });
import Queue from "p-queue";

async function connectRedisClients(){
    try {
        await worker.connect();
        await completedOrdersSubscriber.connect()
        console.log('all redis clients connected successfully');
    } catch (error) {
        console.log('failed to connect all redis clients');
        console.log('exiting gracefully');
        process.exit(1)
    }
}

connectRedisClients()

const queue = new Queue({ concurrency: 1 });

async function insertOne() {
    try {
        await prisma.binance_mark_prices.create({
            data: {
                time: new Date(),
                symbol: 'BTCUSDT',
                price: 23232.21313
            }
        })
        console.log('Inserted successfully');

    } catch (error) {
        console.log('Inserting failed : ', error);
    }
}

async function dumpIntoTimescaleDB() {
    const len = await worker.lLen("dump_timescaleDB")
    console.log('current length of the queue : ', len);

    let cnt = 30;
    if (len < 30) {
        cnt = len;
    }
    const finalData = {}
    for (let i = 0; i < cnt; i++) {
        const popped = await worker.lPop("dump_timescaleDB")

        const data = JSON.parse(popped)
        
        const timeStr = data.time;
        if (!timeStr) {
            console.log('Time not given');
            return;
        }

        const time = new Date(timeStr)

        delete data.time

        for (const symbol in data) {
            if (!finalData[symbol]) {
                finalData[symbol] = []
            }
            finalData[symbol].push({
                price: data[symbol],
                time: time
            })
        }
    }


    const queries = []
    const times = new Map()
    Object.entries(finalData).map(([symbol, data]) => {
        for (let i = 0; i < data.length; i++) {

            const { price, time } = data[i];
            // console.log('price  : ',price);
            // console.log('time : ',time);

            const query = {
                time,
                price,
                symbol
            }

            queries.push(query)
        }
    })
    console.log('queries.length : ',queries.length);
    

    try {
        console.log('Dumping all data to the DB');
        await prisma.binance_mark_prices.createMany({
            data: queries
        })
        console.log('Data inserted successfully');
    } catch (error) {
        console.log('Data insertion failed : ', error);
    }

}

console.log('current time : ',new Date().toISOString());

async function refresh1m(){
    try {
        await prisma.$executeRawUnsafe(`
        CALL refresh_continuous_aggregate('candles_1m', (NOW() - INTERVAL '5 minutes')::timestamp, NOW()::timestamp);
      `);
      console.log('refresh cmd successfull for candles_1m');
      
    } catch (error) {
        console.log('failed to refresh for 1 minute candles Error : ',error);
    }
}

async function refresh5m(){
console.log("Every 5 minutes:", new Date().toISOString());
    try {
        await prisma.$executeRawUnsafe(`
        CALL refresh_continuous_aggregate('candles_5m', (NOW() - INTERVAL '30 minutes')::timestamp, (NOW())::timestamp);
    `);
      console.log('refresh cmd successfull for candles_5m');

    } catch (error) {
        console.log('failed to refresh for 5 minute candles : ',error);
    }
}

async function refresh1h(){
    console.log("Every 1 hour:", new Date().toISOString());
    try {
        await prisma.$executeRawUnsafe(`
            CALL refresh_continuous_aggregate('candles_1h', (NOW() - INTERVAL '6 hours')::timestamp, (NOW())::timestamp);
        `);
          console.log('refresh cmd successfull for candles_1h');

    } catch (error) {
        console.log('failed to refresh for 5 minute candles');
    }
}

async function storeCompletedOrders(){
    if(!completedOrdersSubscriber.isOpen){
        return;
    }
    const len = await completedOrdersSubscriber.lLen("orders_completed")
    console.log('length of orders_completed : ',len);
    const storeOrdersQueries=[]
    for(let i=0;i<len;i++){
        try {
            const orderStr = await completedOrdersSubscriber.rPop("orders_completed")
            const order = JSON.parse(orderStr)
            console.log('order thats rPopped : ',order);
            storeOrdersQueries.push(order)
        } catch (error) {
            
        }
    }
    try {
        console.log('length of storeOrdersQueries : ',storeOrdersQueries.length);
        const response = await prisma.order.createMany({
            data:storeOrdersQueries
        })
        console.log('response after storing completed orders in db : ',response);
        
    } catch (error) {
        console.log('Failed to stoire completed orders in db : ',error);
    }
}

// 30 seconds
cron.schedule("0,30 * * * * *",()=>{
    if(!worker.isOpen)return;
    console.log('30 seconds');
    queue.add(()=>dumpIntoTimescaleDB())   
})

// 1 minute
cron.schedule("0 * * * * *", () => {
    console.log('1 minute');
    setTimeout(()=>{
        queue.add(() => refresh1m());
    },500)
    storeCompletedOrders()
});

// 5 minutes
cron.schedule("0 */5 * * * *", () => {
    setTimeout(()=>{
        queue.add(() => refresh5m());
    },500)
});

//1 hour
cron.schedule("0 0 * * * *", () => {
    setTimeout(()=>{
        queue.add(() => refresh1h());
    },500)
});