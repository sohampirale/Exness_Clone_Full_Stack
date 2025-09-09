import dotenv from "dotenv"
dotenv.config()

import WebSocket, {WebSocketServer} from "ws";
import { createClient } from "redis";
import type {IUserRequest} from "./interfaces/index.js";
import { v4 as uuidv4 } from "uuid";
import { defaultList } from "./constants/index.js";

const subscriber = createClient({url:process.env.REDIS_DB_URL!});
subscriber.connect();

interface ISocket extends WebSocket{
  id?:string
}

interface UserData{
  socket:ISocket,
  list:string[]
}

const activeUsers: Map<string, UserData>  = new Map();
const requestedSymbols: Set<string> = new Set();

function sendMarkPriceToUsers(data:any){
  console.log('inside sendMarkPriceToUsers data : ',data);
  
  const {markPrice,symbol,buyPrice,sellPrice}=data;

  const response ={
    symbol,
    markPrice,
    buyPrice,
    sellPrice
  }
  const responseStr=JSON.stringify(response)
  for(const [socketId,userData] of activeUsers){
    const {list,socket}=userData;
    if(list.includes(symbol)){
      console.log('sending livePrice of ',symbol);
      socket.send(responseStr)
    }
  }
}

defaultList.forEach((symbol)=>{
  if(!requestedSymbols.has(symbol)){
    requestedSymbols.add(symbol)
    subscriber.subscribe(symbol,(dataStr)=>{
        const data = JSON.parse(dataStr)
        console.log('data received from pub-sub for ',symbol,' is : ',data);
        data.symbol=symbol
        sendMarkPriceToUsers(data)
      })
  }
})


const wss = new WebSocketServer({ port: 3002 });
wss.on('connection',(socket:ISocket)=>{
  
    socket.id=uuidv4()    
    console.log('New client connected at websocket_server');
    activeUsers.set(socket.id,{
      socket,
      list:defaultList
    })

    socket.on('message',(data:string)=>{
      try {
        const response:IUserRequest=JSON.parse(data)
        console.log('data from client : ',response);
        if(response.request=='update_my_list'){
          const list = response.list;
          if(Array.isArray(list)){
            const user=activeUsers.get(socket.id)
            if(user){
              user.list=list
              list.forEach((symbol)=>{
                if(!requestedSymbols.has(symbol)){
                  subscriber.subscribe(symbol,(dataStr)=>{
                    const data = JSON.parse(dataStr)
                    console.log('data received from pub-sub for ',symbol,' is : ',data);
                    data.symbol=symbol
                    sendMarkPriceToUsers(data)
                  })
                  requestedSymbols.add(symbol)
                }
              })
            }
          }
        } else if(response.request=='Auth'){
          const {accessToken}=response;
          console.log('accessToken : ',accessToken);
          
        }
      } catch (error) {
        console.log('ERROR : ',error);
      }

    })

    socket.on("disconnection",()=>{
      console.log('Disconnected');
    })
})