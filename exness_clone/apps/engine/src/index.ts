import { createClient } from "redis";

const subscriber = createClient({url:process.env.REDIS_DB_URL!});
subscriber.connect().then(()=>{
  console.log('Redis DB connected successfully');
  
})
.catch((err)=>{
  console.log('Failed to conenct to redis DB ',err);
  console.log('Exiting process gracefully');
  process.exit(1)
});


async function executeOrders(){
  while(1){
    try {
      console.log('doing brPop');
      
      const data = await subscriber.brPop("orders",0)
      const orderStr = data?.element
      const order = JSON.parse(orderStr)
      const type=order.type;
      const request=order.request;

      console.log('order received : ',order);

      if(type=='NORMAL'){
        if(request=='OPEN'){
          //call openOrder(order) function
        } else if(request=='CLOSE'){
          //call closeOrder(order) function
        }
      } else if(type=='LEVERAGE'){
        if(request=='OPEN'){
          //call openLeverageOrder
        } else if(request=='CLOSE'){
          //call closeLeverageOrder
        }
      } 

      
    } catch (error) {
      console.log(`failed to brPop from queue "orders" `);
      console.log('ERROR : ',error);
    }
  }

}

async function addNewUsers(){
  
}

executeOrders()
