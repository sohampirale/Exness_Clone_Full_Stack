"use client"
import { useEffect, useState } from "react"

export default function Home() {
  const [symbol,setSymbol]=useState("")
  const [list,setList]=useState([])
  const [socket,setSocket]=useState(null)

  useEffect(()=>{
    const socket = new WebSocket("wss://glorious-space-disco-q7gq65wrrvrv24pgv-3001.app.github.dev")
    socket.onopen=()=>{
      console.log('Ws Conencted successfulyl from client side ')
    }
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received data:", data);
    };
    setSocket(socket)
  })


  function handleAddNewSymbol(){
    if(!socket)return
    const request={
      request:"update_my_list",
      list
    }
    console.log('Sending request for update_my_list');
    
    socket.send(JSON.stringify(request))
  }

  return (
   <div>
    <p>Hello World</p>
    <input type="text" value={symbol} onChange={(e)=>setSymbol(e.target.value)} />
    <button onClick={handleAddNewSymbol}></button>
   </div>
  );
}
