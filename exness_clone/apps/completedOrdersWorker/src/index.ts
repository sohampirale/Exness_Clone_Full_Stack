import {createClient} from "redis"
import prisma from "db/client"

export const completedOrdersSubscriber  = createClient({ url: process.env.REDIS_DB_URL! });

async function connectRedisClients(){
  try {
    await completedOrdersSubscriber.connect()
    console.log('completedOrdersSubscriber connected successfully');
    
  } catch (error) {
    console.log('failed to connect to redis DB');
    console.log('exiting gracefully');
    process.exit(1)
  }
}


connectRedisClients()

async function work(){
  while(1){
    try {
      console.log('doing brPop on orders_completed');
      
      const {key,element} = await completedOrdersSubscriber.brPop("orders_completed",0);
      const order = JSON.parse(element)
      console.log('order received to dump at DB : ',order);
      const newOrder=await prisma.order.create({
        data:order
      })
      console.log('newOrder : ',newOrder);
      
    } catch (error) {
      console.log('ERROR :: work : ',error);
    }
  }
}

let IntId=setInterval(()=>{
  if(completedOrdersSubscriber.isOpen){
    clearInterval(IntId)
    work()
  }
},1000)
