import dotenv from "dotenv"
dotenv.config()
import { createClient } from "redis";
import { activeUsers, livePrices, offset, redisSubscriber, setActiveUsers, setOffset, snapshotDumpInterval, updateRediSubscriber } from "./variables";
import { v4 as uuidv4 } from "uuid";
import { setReqSymbols } from "./helpers/symbols";
import { recoverFromSnapshot } from "./helpers/recovery";
import { closeLeverageOrder, closeOrder, openLeverageOrder, openOrder } from "./handlers/order.handler";
import { manageBuyPQS, manageLeverageBuyPQS, manageLeverageSellPQS, manageSellPQS } from "./helpers/PQmanager";

export const ordersSubscriber = createClient({ url: process.env.REDIS_DB_URL! });
export const newUsersSubscriber = createClient({ url: process.env.REDIS_DB_URL! });
export const redisPublisher = createClient({ url: process.env.REDIS_DB_URL! });
export const snapshotSubscriber = createClient({ url: process.env.REDIS_DB_URL! });
export const recoveryOrdersSubscriber = createClient({ url: process.env.REDIS_DB_URL! })
const tempRediSubscriber=createClient({ url: process.env.REDIS_DB_URL! })
updateRediSubscriber(tempRediSubscriber)

let recoveryDone = false;

async function connectAllRedisClients() {
  try {
    await recoveryOrdersSubscriber.connect()
    await snapshotSubscriber.connect()
    await ordersSubscriber.connect()
    await newUsersSubscriber.connect()
    await redisPublisher.connect()
    await redisSubscriber.connect()
    console.log('All redis clients connected');

    setReqSymbols(redisSubscriber)

    await redisSubscriber.pSubscribe('*', async (dataStr: any, symbol: string) => {
      try {
        
        const data = JSON.parse(dataStr)
        data.symbol = symbol;
        if ((!data.sellPrice && data.sellPrice != 0) || (!data.buyPrice && data.buyPrice != 0)) {
          console.log('unnncesaary pub sub for liveData : ',data);
          
          return
        }
        livePrices.set(symbol, data)
        manageBuyPQS(data)
        manageSellPQS(data)
        manageLeverageBuyPQS(data)
        manageLeverageSellPQS(data)
      } catch (error) { 
        //subscring to unncessary channels who does not belong to livePrices pub sub thing
      }
    });

    const latestSnapshot = await snapshotSubscriber.lIndex("activeusers_snapshot", -1)
   

    let snapshot = JSON.parse(latestSnapshot)

    if (!snapshot) {
      console.log('No snapshot found');
    } else {
      setOffset(snapshot.lastExecutedOffset)
  
      console.log('latest snapshot : ', snapshot);
  
      setActiveUsers(snapshot)
  
      const from = snapshot.lastExecutedOffset;
      const to = -1;
      console.log('finding out missingOrders');
  
      const missingOrders = await recoveryOrdersSubscriber.lRange("orders:log", from+1, to);
      if (!missingOrders || (Array.isArray(missingOrders) && missingOrders.length == 0)) {
        console.log('No missing orders found');
      } else {
        console.log('missing orders : ', missingOrders);
        const recoveryOrders = []
        for (let i = 0; i < missingOrders.length; i++) {
          recoveryOrders.push(JSON.parse(missingOrders[i]))
        }
  
        console.log('recoveryOrders : ',recoveryOrders);
        

        snapshot=await recoverFromSnapshot(snapshot,recoveryOrders)
        setActiveUsers(snapshot)
        console.log('recoveryOrders.length : ',recoveryOrders.length);
        
      }
    }
    recoveryDone = true

  } catch (error) {
    console.log('Failed to connect all required redis clients, ERROR : ', error);
    console.log('Exiting process gracefully');
    process.exit(1)
  }
}

connectAllRedisClients()

let IntId1 = setInterval(() => {
  if (ordersSubscriber.isOpen && recoveryDone) {
    clearInterval(IntId1)
    executeOrders()
  }
}, 2000)

let IntId2 = setInterval(() => {
  if (newUsersSubscriber.isOpen && recoveryDone) {
    clearInterval(IntId2)
    addNewUsers()
  }
}, 2000)

async function executeOrders() {
  while (1) {

    try {
      console.log('doing brPop');

      const data = await ordersSubscriber.brPop("orders", 0)

      const orderStr = data?.element
      const order = JSON.parse(orderStr)
      console.log('order received at engine : ',order);
      
      const type = order.type;
      const request = order.request;
      
      if (type == 'NORMAL') {
        if (request == 'OPEN') {
          //call openOrder(order) function
          openOrder(order)
        } else if (request == 'CLOSE') {
          closeOrder(order)
          //call closeOrder(order) function
        }
      } else if (type == 'LEVERAGE') {
        if (request == 'OPEN') {
          openLeverageOrder(order)
          //call openLeverageOrder
        } else if (request == 'CLOSE') {
          closeLeverageOrder(order)
          //call closeLeverageOrder
        }
      } else {
        console.log('invalid order data provided');
      }

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
      console.log('user : ',user);
      
      const { userId, userData, bal } = user

      if (!activeUsers[userId]) {
        activeUsers[userId] = {
          userData,
          bal
        }
        console.log('new activeUsers : ',activeUsers);
      }
      
    } catch (error) {
      console.log('ERROR :: addNewUsers : ', error);
    }
  }
}

setInterval(() => {
  console.log('activeUsers and their balances: ');

  for (const [key, value] of Object.entries(activeUsers)) {
    console.log(`username : ${value?.userData?.username}, bal.usd : ${value?.bal?.usd?.reserved}`);
  }
}, 5000)

let temp = 0

// setInterval(()=>{
//   console.log('livePrcies : ',livePrices);
  
// },5000)

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
  activeUsers.lastExecutedOffset = offset
  console.log('dumping snapshot : ',activeUsers);
  redisPublisher.rPush("activeusers_snapshot", JSON.stringify(activeUsers))
}, snapshotDumpInterval)