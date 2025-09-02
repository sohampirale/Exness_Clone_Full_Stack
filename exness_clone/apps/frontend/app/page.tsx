"use client"
import { useEffect, useState } from "react";

export default function Home() {
  const [ws,setWS]=useState(null)
  useEffect(()=>{
    console.log('starting to make websocket connection');
    
    const ws:WebSocket=new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_SERVER_URL!);

    ws.onopen = () => {
      console.log('Connected to WebSocket');
      setWS(ws)
      ws.onmessage = (event) => {
        console.log('Message received:', event.data);
      };
    };

   
  },[])

  function helperUpdateMyList(){
    if(!ws){
      console.log('WS connection not established');
      return;
    }

    try {
      const data={
        request:"update_my_list",
        list:['BTCUSDT','SOLUSDT']
      }  
      ws.send(JSON.stringify(data))
    } catch (error) {
      console.log('Failed to update user list');
      
    }
  }
  return (
    <div>
      <p>Hello World</p>
      <button onClick={helperUpdateMyList}>Update my list</button>
    </div>
  );
}
