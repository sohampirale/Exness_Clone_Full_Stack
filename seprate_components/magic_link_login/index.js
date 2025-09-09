import dotenv from "dotenv"
dotenv.config()
import cookieParser from "cookie-parser"
import jwt from "jsonwebtoken"
import express from "express"
import { Resend } from 'resend';
const app =express()
app.use(express.json())
app.use(cookieParser())

async function sendEmail(email,body){

  const resend = new Resend(process.env.RESEND_API_KEY);

  const response=await resend.emails.send({
    from: 'Acme <onboarding@resend.dev>',
    to: [email],
    subject: 'hello world',
    html: body,
  });
  console.log('response after sending email : ',response);
  
}

const users=[]
const usedTokens=[]

app.post("/api/v1/signup",(req,res)=>{
  const {email}=req.body
  if(!email){
    res.status(400).json({
      message:`Invalid/Insufficient data provided`
    })
  }
  let exists=false;
  for(let i=0;i<users.length;i++){
    if(users[i].email==email){
      exists=true
      break
    }
  }
  if(exists){
    res.status(409).json({
      message:`User already exists with that email`
    })
  }
  const obj={
    email
  }
  users.push(obj)
  res.status(201).json({
    message:`Signup successfull`
  })
})

app.post("/api/v1/signin",async(req,res)=>{
  const {email}=req.body
  if(!email){
    res.status(400).json({
      message:`Invalid/Insufficient data provided`
    })
  }

  let exists=false;
  for(let i=0;i<users.length;i++){
    if(users[i].email==email){
      exists=true;
      break;
    }
  }
  if(!exists){
    res.status(404).json({
      message:`User not found with that email`
    })
  }
  const token = jwt.sign({
    email
  },process.env.ACCESS_TOKEN_SECRET)

  console.log('token is : ',token);

  let magicUrl=`${process.env.BACKEND_URL}/api/v1/signin/post?token=${token}`

  const obj={
    message:`Please visit this link`,
    link:magicUrl
  }

  try {
    await sendEmail(email,JSON.stringify(obj))
    console.log('email sent successfully');
    
    res.status(200).json({
      message:'Check your email'
    })

  } catch (error) {
    console.log('Failed to send email');

    res.status(500).json({
      message:'Signup failed'
    })
  }

})

app.get("/api/v1/signin/post",(req,res)=>{
  const {token}=req.query
  console.log('token : ',token);
  try {
    const decoded = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    if(usedTokens.includes(token)){
      return res.status(400)
      .json({
        message:`This token is already used for signin`
      })
    }
    console.log('decoded info : ',decoded);
    usedTokens.push(token)
    return res
    .cookie("token",token)
    .status(200)
    .json({
      message:`Welcome ${decoded.email}, signin successfull`
    })
  } catch (error) {   
    return res.status(500).json({
      message:`Invalid token`
    })
  }
})

setInterval(()=>{
  console.log('users : ',users);
},5000)

app.listen(3000,()=>{
  console.log('server listening on port 3000');
})