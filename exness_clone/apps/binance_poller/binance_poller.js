import dotnev from 'dotenv'
dotnev.config()
import WebSocket from "ws"
import { createClient } from "redis";
import { generateDecreasedSellPrice, generateIncreasedBuyPrice } from './priceInlfator.js';

const wsUrl='wss://fstream.binance.com/ws/!markPrice@arr@1s'

const publisher = createClient({url:process.env.REDIS_DB_URL});
await publisher.connect();

const ws=new WebSocket(wsUrl)
ws.on("open",()=>{
    console.log('Conencted ')
})

ws.on("message",async (msg) => {

  
  const allData = JSON.parse(msg);
  // console.log(allData);
  
  console.log('allData.length : ',allData.length);
  const DBData={
    time:Date.now()
  }
  allData.forEach(async(data) => {
    const {e:eventType,E:eventTime,s:symbol,p:markPriceStr,i:indexPrice,P:estimatedSettlePrice,r:fundingRate,T:nextFundingTime}=data;
    const markPrice=Number(markPriceStr)
    await publisher.publish(symbol,JSON.stringify({
      markPrice,
      buyPrice:generateIncreasedBuyPrice(markPrice),
      sellPrice:generateDecreasedSellPrice(markPrice)
    }))
    DBData[symbol]=markPrice
  });
  console.log('published live data to redis pub sub');

  await publisher.rPush("dump_timescaleDB",JSON.stringify(DBData));
  console.log('Pushed live data to redis queue');
  
});


/**
 *   {
    "e": "markPriceUpdate",  	// Event type
    "E": 1562305380000,      	// Event time
    "s": "BTCUSDT",          	// Symbol
    "p": "11794.15000000",   	// Mark price
    "i": "11784.62659091",		// Index price
    "P": "11784.25641265",		// Estimated Settle Price, only useful in the last hour before the settlement starts
    "r": "0.00038167",       	// Funding rate
    "T": 1562306400000       	// Next funding time
  }
 */