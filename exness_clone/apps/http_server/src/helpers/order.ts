import { activeUsers, livePrices } from "../variables/index.js";

export async function closeBuyOrder(orderId:string,ownerId:string){
    if(!orderId || !ownerId){
        console.log('orderId or ownerId not given');
        return false;
    }
    const activeBuyOrders=activeUsers[ownerId]?.activeBuyOrders
    if(!activeBuyOrders){
        console.log('No active buy orders found for user : ',activeUsers[ownerId].userData?.username);
        return false;
    } 
    let index=activeBuyOrders.findIndex((oneOrder:any)=>oneOrder.orderId==orderId);
    
    if(index ==-1){
        console.log('Requested order not foud or is already closed');
        return false;
    }
    let order = activeBuyOrders[index]

    const livePriceData=livePrices.get(order.symbol)
    if(!livePriceData){
        console.log('Live price not foud for symbol : ',order.symbol);
        return false;
    }

    const livePrice = livePriceData.sellPrice;
    const sellAmt=order.qty*livePrice;
    const reservedAmt=activeUsers[ownerId].bal?.usd?.reserved;

    if(!reservedAmt){
        console.log('NO reserved amt foud for user');
        return;
    }

    const buyAmt=order.qty*order.price
    console.log('resevred amout of user ',activeUsers[ownerId].userData?.username,' incresed from : ',reservedAmt,' to : ',reservedAmt+(buyAmt-sellAmt));
    
    activeUsers[ownerId].bal.usd.reserved=reservedAmt+(sellAmt-buyAmt)
    activeBuyOrders.splice(index, 1);
    console.log('requested buy order successfully closed');
    return true;
}

/**
 * 1.check if user exists in activeUsers
 * 2.check if the order with orderId exists in activeUsers[ownerId].activeUsers
 * 3.fetch that exact order from liveOrders
 * 4.retrive the live buy price of that symbol 
 * 5.calculate buyAmt = (order.qty*liveBuyPrice)
 * 6.calculate sellAmt = (order.qtty*order.price)
 * 7.calculate sellAmt-buyAmt (netBal)
 * 8.calcualte order.margin+netBal and add it in the reserved 
 */

export async function closeSellOrder(orderId:string,ownerId:string){
    if(!activeUsers[ownerId]){
        console.log('Owner not found');
        return false;
    }
    const activeSellOrders=activeUsers[ownerId].activeSellOrders
    if(!activeSellOrders){
        console.log('No active sell order found');
        return false;
    }
    const index = activeSellOrders.findIndex((oneOrder:any)=>oneOrder.orderId==orderId)
    if(index==-1){
        console.log('Order not found in activeSellOrder,it might be stopped with stopPrice PQ');
        return;
    }
    let order = activeSellOrders[index]
    console.log('sellOrder that is going to be closed : ',order);
    
    const liveData = livePrices.get(order.symbol)

    if(!liveData){
        console.log('Live data not foud for symbol : ',order.symbol);
        return;
    }

    const {buyPrice}=liveData
    if(!buyPrice){
        console.log('buyPrice not found for symbol : ',order.symbol);
        return;
    }
    activeSellOrders.splice(index,1)
    const buyAmt=order.qty*buyPrice
    const sellAmt=order.qty * order.price
    const netBal = sellAmt-buyAmt
    const finalNetBal=order.margin+netBal
    console.log('final net balance from this trxn : ',finalNetBal);
    activeUsers[ownerId].bal.usd.reserved+=finalNetBal
    console.log('Sell order closed successfully');
    return true;
}