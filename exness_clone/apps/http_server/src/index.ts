import dotenv from "dotenv"
dotenv.config()
import express from 'express'
const app = express();
import cookieParser from "cookie-parser"


//routers
import candlesRouter from "./routes/candles.routes.js";
import userRouter from "./routes/user.routes.js";
import orderRouter from "./routes/order.routes.js";

import { activeUsers, buyPQS, redisSubscriber, reqSymbols, updateRediSubscriber } from "./variables/index.js";
import connectRedisDB from "./lib/connectRedisDB.js";
import { manageBuyPQS, manageSellPQS } from "./helpers/PQmanager.js";

app.use(express.json())
app.use(cookieParser())

connectRedisDB()
.then((subscriber)=>{
    updateRediSubscriber(subscriber)
    reqSymbols.forEach((symbol)=>{
        
        subscriber.subscribe(symbol,(dataStr)=>{
            const data=JSON.parse(dataStr)
            data.symbol=symbol;
            if(symbol=='BTCUSDT'){
                console.log('buyPrice price of bitcoin is : ',data.buyPrice);
                console.log('sellPrice price of bitcoin is : ',data.sellPrice);
            }
            // console.log('Data received for symbol ',symbol,' is : ',data);
            manageBuyPQS(data)
            manageSellPQS(data)
        })
    })
})
.catch((err)=>{
    console.log('Failed to connect to Redis DB ... exiting gracefully');
    process.exit(1)
})

app.use("/api/v1/candles",candlesRouter)
app.use("/api/v1/user",userRouter)
app.use("/api/v1/order",orderRouter)

app.get('/',(req,res)=>{
    return res.send("Hello World from http-server")
})

app.listen(3001,()=>{
    console.log('Server listening on port 3001');
})

setInterval(()=>{
    console.log('activeUsers : ',activeUsers);
    
},10000)