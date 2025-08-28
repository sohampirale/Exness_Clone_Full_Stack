import { createClient } from "redis";
import { PrismaClient } from "@prisma/client";
const prisma=new PrismaClient()
const worker = createClient({url:process.env.REDIS_DB_URL});
await worker.connect();

async function insertOne(){
    try {
        await prisma.binance_mark_prices.create({
            data:{
                time:new Date(),
                symbol:'BTCUSDT',
                price:23232.21313
            }
        })
        console.log('Inserted successfully');
        
    } catch (error) {
        console.log('Inserting failed : ',error);
    }
}

async function dumpIntoTimescaleDB(){
    const len=await worker.lLen("dump_timescaleDB")
    console.log('current length of the queue : ',len);
    
    let cnt=30;
    if(len<30){
        cnt=len;   
    }
    const finalData={}
    for(let i=0;i<cnt;i++){
        const popped=await worker.lPop("dump_timescaleDB")
        
        const data = JSON.parse(popped)
        
        const timeStr=data.time;
        if(!timeStr){
            console.log('Time not given');
            return;
        }

        const time= new Date(timeStr)

        delete data.time

        for(const symbol in data){
            if(!finalData[symbol]){
                finalData[symbol]=[]
            }
            finalData[symbol].push({
                price:data[symbol],
                time:time
            })
        }
    }

    
    const queries=[]
    const times=new Map()
    Object.entries(finalData).map(([symbol,data])=>{
        for(let i=0;i<data.length;i++){
            
            const {price,time}=data[i];
            // console.log('price  : ',price);
            // console.log('time : ',time);

            const query={
                time,
                price,
                symbol
            }

            queries.push(query)
        }
    })
    
    try {
        console.log('Dumping all data to the DB');
        await prisma.binance_mark_prices.createMany({
            data:queries
        })
        console.log('Data inserted successfully');
    } catch (error) {
        console.log('Data insertion failed : ',error);
    }
    
}

setInterval(dumpIntoTimescaleDB,30000)