import { createClient } from "redis";
import { Resend } from "resend";
const redisSubscriber = createClient({ url: process.env.REDIS_DB_URL })

async function connectRedisClient() {
  try {
    await redisSubscriber.connect()
    console.log('redis client connected successfully');

  } catch (error) {
    console.log('failed to connect with redis db');
    console.log('exiting gracefully');
    process.exit(1)
  }
}

connectRedisClient()

let IntId1 = setInterval(() => {
  if (redisSubscriber.isOpen) {
    clearInterval(IntId1)
    sendEmailNotification()
  }
}, 1000)


async function sendEmail(email:string,subject:string,body:string){

  const resend = new Resend(process.env.RESEND_API_KEY);

  const response=await resend.emails.send({
    from: 'Acme <onboarding@resend.dev>',
    to: [email],
    subject,
    html: body,
  });
  console.log('response after sending email : ',response);
  
}

async function sendEmailNotification() {
  while (1) {
    try {
      const {key,element} = await redisSubscriber.brPop("notifications_email",0)
      const order = JSON.parse(element)
      console.log('order for sending email : ',order);
      await sendEmail(order.email,order.subject,order.body)
    } catch (error) {
      console.log('failed to send email to : ',order.email);
    }
  }
}