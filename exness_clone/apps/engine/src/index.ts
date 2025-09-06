import dotenv from "dotenv"
dotenv.config()
import { createClient } from "redis";
import { activeUsers, offset, setActiveUsers, setOffset, snapshotDumpInterval } from "./variables";
import { NIL } from "uuid";

const ordersSubscriber = createClient({ url: process.env.REDIS_DB_URL! });
const newUsersSubscriber = createClient({ url: process.env.REDIS_DB_URL! });
const redisPublisher = createClient({ url: process.env.REDIS_DB_URL! });
const snapshotSubscriber = createClient({ url: process.env.REDIS_DB_URL! });
const recoveryOrdersSubscriber = createClient({url:process.env.REDIS_DB_URL!})

let recoveryDone=false;

async function connectAllRedisClients(){
  try {
    await recoveryOrdersSubscriber.connect()
    await snapshotSubscriber.connect()
    await ordersSubscriber.connect()
    await newUsersSubscriber.connect()
    await redisPublisher.connect()

    console.log('All redis clients connected');

    const latestSnapshot = await snapshotSubscriber.lIndex("activeusers_snapshot", -1)
    const snapshot = JSON.parse(latestSnapshot)

    if(!snapshot){
      console.log('No snapshot found');
      return
    }

    setOffset(snapshot.lastExecutedOffset)

    console.log('latest snapshot : ',snapshot);
    
    setActiveUsers(snapshot)

    const from = snapshot.lastExecutedOffset;         
    const to   = -1;         
    console.log('finding out missingOrders');
    
    const missingOrders = await recoveryOrdersSubscriber.lRange("orders:log", from, to);
    if(!missingOrders || (Array.isArray(missingOrders) && missingOrders.length==0)){
      console.log('No missing orders found');
      return;
    }
    console.log('missing orders : ',missingOrders);
    const recoveryOrders =[]
    for(let i=0;i<missingOrders.length;i++){
      recoveryOrders.push(JSON.parse(missingOrders[i]))
    }

    //TODO
    //await recover from recoveryOrders

    recoveryDone=true

  } catch (error) {
    console.log('Failed to connect all required redis clients, ERROR : ',error);
    console.log('Exiting process gracefully');
    process.exit(1)
  }
}

connectAllRedisClients()

let IntId1=setInterval(()=>{
  if(ordersSubscriber.isOpen && recoveryDone){
    clearInterval(IntId1)
    executeOrders()
  }
},2000)

let IntId2=setInterval(()=>{
  if(ordersSubscriber.isOpen && recoveryDone){
    clearInterval(IntId2)
    addNewUsers()
  }
},2000)

async function executeOrders() {
  while (1) {
    if(!ordersSubscriber.isOpen){

    }
    try {
      console.log('doing brPop');

      const data = await ordersSubscriber.brPop("orders", 0)

      const orderStr = data?.element
      // const order = JSON.parse(orderStr)
      // const type = order.type;
      // const request = order.request;
      // if (type == 'NORMAL') {
      //   if (request == 'OPEN') {
      //     //call openOrder(order) function
      //   } else if (request == 'CLOSE') {
      //     //call closeOrder(order) function
      //   }
      // } else if (type == 'LEVERAGE') {
      //   if (request == 'OPEN') {
      //     //call openLeverageOrder
      //   } else if (request == 'CLOSE') {
      //     //call closeLeverageOrder
      //   }
      // }

      const order = orderStr
      console.log('order received : ', order);

    } catch (error) {
      console.log(`failed to brPop from queue "orders" `);
      console.log('ERROR : ', error);
    }
  }
}

async function addNewUsers() {
  while (1) {
    try {
      console.log('waiting for newuser');

      const { key, element } = await newUsersSubscriber.brPop("newuser", 0)

      const user = JSON.parse(element)
      const { userId, userData, bal } = user

      if (!activeUsers[userId]) {
        activeUsers[userId] = {
          userData,
          bal
        }
      }

    } catch (error) {
      console.log('ERROR :: addNewUsers : ', error);
    }
  }
}

setInterval(() => {
  console.log('activeUsers : ', activeUsers);
}, 5000)

let temp=0

// setInterval(async()=>{
//   try {
//     setOffset(offset+1)
//     temp++;
//     await redisPublisher.RPUSH("orders:log",JSON.stringify({
//       orderId:temp,
//       offset
//     }))
//   } catch (error) {
//     console.log('failed to rpush a order');
//   }
// },3000)

setInterval(() => {
  console.log('dumping snapshot');
  activeUsers.lastExecutedOffset = offset
  redisPublisher.rPush("activeusers_snapshot", JSON.stringify(activeUsers))
}, snapshotDumpInterval)