import dotenv from "dotenv"
dotenv.config()
import express from 'express'
const app = express();
import cookieParser from "cookie-parser"
import cors from "cors"

//routers
import candlesRouter from "./routes/candles.routes.js";
import userRouter from "./routes/user.routes.js";
import orderRouter from "./routes/order.routes.js";

import { activeUsers, buyPQS, livePrices, redisSubscriber, updateRediSubscriber } from "./variables/index.js";
import connectRedisDB from "./lib/connectRedisDB.js";
import { manageBuyPQS, manageLeverageBuyPQS, manageLeverageSellPQS, manageSellPQS } from "./helpers/PQmanager.js";
import { setReqSymbols } from "./helpers/symbols.js";
import tokenRouter from "./routes/toke.routes.js";

app.use(express.json())
app.use(cookieParser())

const allowedOrigins = ['https://urban-palm-tree-v6wx5766vxq3w696-3000.app.github.dev'];

const corsOptions = {
  origin: function (origin:string, callback:any) {
 
    if (!origin||allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials:true
};

app.use(cors(corsOptions));

connectRedisDB()
.then(async(subscriber)=>{

    setReqSymbols(subscriber)

    await subscriber.pSubscribe('*',async (dataStr, symbol) => {
        try {
            const data=JSON.parse(dataStr)
            data.symbol=symbol;
            if((!data.sellPrice && data.sellPrice!=0) || (!data.buyPrice && data.buyPrice!=0)){
                return
            }
            livePrices.set(symbol,data)
            manageBuyPQS(data)
            manageSellPQS(data)
            manageLeverageBuyPQS(data)
            manageLeverageSellPQS(data)
        } catch (error) {}
    });

  
})
.catch((err)=>{
    console.log('Failed to connect to Redis DB ... exiting gracefully');
    process.exit(1)
})

app.use("/api/v1/candles",candlesRouter)
app.use("/api/v1/user",userRouter)
app.use("/api/v1/order",orderRouter)
app.use("/api/v1/token",tokenRouter)

app.get('/',(req,res)=>{
    return res.send("Hello World from http-server")
})

app.listen(3001,()=>{
    console.log('Server listening on port 3001');
})

setInterval(()=>{
    console.log('activeUsers : ',activeUsers);
    
},10000)