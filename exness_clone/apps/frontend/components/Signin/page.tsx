"use client"
import axios from "axios"
import { useState } from "react"
import { getSocket } from "../../lib/getSocket"

export default function Signin(){
  const[identifier,setIdentifier]=useState("")
  const [password,setPassword]=useState("")

  const socket= getSocket()
  console.log('Socket : ',socket);

  async function helperSignin(){
    try {
      const {data:response} = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL!}/api/v1/user/signin`,{
        identifier,
        password
      },
      {
        withCredentials: true, 
      })
      console.log('response : ',response);
      
    } catch (error) {
      console.log('Failed to signin : ',error);
    }
  }

  return (
    <>
      <input type="text" value={identifier} onChange={(e)=>setIdentifier(e.target.value)}/>
      <input type="text" value={password} onChange={(e)=>setPassword(e.target.value)}/>
      <button onClick={helperSignin}>Signin</button>
    </>
  )
}