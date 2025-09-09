"use client"
import axios from "axios"
import { useState } from "react"
import { getSocket } from "../../lib/getSocket"

export default function Signup(){
  const[username,setUsername]=useState("")
  const [email,setEmail]=useState("")
  const [password,setPassword]=useState("")
const socket= getSocket()
  console.log('Socket : ',socket);
  async function helperSignup(){
    try {
      const {data:response} = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL!}/api/v1/user/signup`,{
        username,
        email,
        password
      },{
        withCredentials:true
      })
      console.log('response : ',response);
      
    } catch (error) {
      console.log('Failed to signup : ',error);
    }
  }

  return (
    <>
      <input type="text" value={username} onChange={(e)=>setUsername(e.target.value)}/>
      <input type="text" value={email} onChange={(e)=>setEmail(e.target.value)}/>
      <input type="text" value={password} onChange={(e)=>setPassword(e.target.value)}/>
      <button onClick={helperSignup}>Signup</button>
    </>
  )
}