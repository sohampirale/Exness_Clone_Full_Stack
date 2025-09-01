import dotenv from "dotenv"
dotenv.config()
import express from 'express'
const app = express();
import cookieParser from "cookie-parser"


//routers
import candlesRouter from "./routes/candles.routes.js";
import userRouter from "./routes/user.routes.js";

import { activeUsers } from "./variables/index.js";

app.use(express.json())
app.use(cookieParser())

app.use("/api/v1/candles",candlesRouter)
app.use("/api/v1/user",userRouter)

app.get('/',(req,res)=>{
    return res.send("Hello World from http-server")
})

app.listen(3001,()=>{
    console.log('Server listening on port 3001');
})

setTimeout(()=>{
    console.log('activeUsers : ',activeUsers);
    
})