import { activeUsers, setOffset } from "../variables"

export async function recoverFromSnapshot(snapshot:any,recoveryOrders:any){
  let maxOffset=0;
  for(let i=0;i<recoveryOrders.length;i++){
    const recoveryOrder = recoveryOrders[i]
    if(maxOffset<recoveryOrder.offset){
      maxOffset=recoveryOrder.offset
    }
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
  setOffset(maxOffset)
  return snapshot
}