import { activeUsers } from "../variables"

export async function recoverFromSnapshot(snapshot:any,recoveryOrders:any){
  for(let i=0;i<recoveryOrders.length;i++){
    const recoveryOrder = recoveryOrders[i]
    const {owner,activeBuyOrders,activeSellOrders,activeLeverageBuyOrders,activeLeverageSellOrders}=recoveryOrder
    if(!owner){
      console.log('owner field not found');
      
      continue
    }

    let user =activeUsers[owner]
    if(!user){
      user={}
      activeUsers[owner]=user
      user=activeUsers[owner]
    }


    if(activeBuyOrders){
      user.activeBuyOrders=activeBuyOrders
    }

    if(activeSellOrders){
      user.activeSellOrders=activeSellOrders
    }

    if(activeLeverageBuyOrders){
      user.activeLeverageBuyOrders=activeLeverageBuyOrders
    }

    if(activeLeverageSellOrders){
      user.activeLeverageSellOrders=activeLeverageSellOrders
    }
    console.log('recovered suyccessfully for user : ',activeUsers[owner]?.userData?.username);
  }
  return snapshot
}