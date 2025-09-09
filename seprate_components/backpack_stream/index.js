import WebSocket from "ws"
const wsUrl='wss://ws.backpack.exchange'

const ws=new WebSocket(wsUrl)
ws.on("open",()=>{
    console.log('Conencted ')
    const obj={
      "method": "SUBSCRIBE",
      "params": ["stream"]
    }
  ws.send(JSON.stringify(obj))
})

ws.on("message",async (data) => {
  const str=JSON.stringify(data)
  if(str=='Ping'){
    console.log('Ping received');
    
    ws.send("Pong")
  }
  console.log('data received from backpack : ',JSON.parse(data));
  
});
