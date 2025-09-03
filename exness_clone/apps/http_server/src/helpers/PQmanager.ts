import { activeUsers, buyPQS, sellPQS } from "../variables/index.js";

export async function manageBuyPQS(data:any){
    console.log('inside manageBuyPQS');
    // console.log('data : ',data);
    const {symbol,sellPrice}=data;
    const pq=buyPQS[symbol]
    if(!pq){
        console.log('Priority queue has not been initialized for symbol : ',symbol);
        return;
    } else if(pq.size()==0){
        console.log('no active buy orders found for symbol : ',symbol);
        return;
    }

    while(1){
        const topMostBuyOrder = pq.peek()
        if(!topMostBuyOrder){
            console.log('no activeBuyOrders right now');
            break;
        }
        console.log('topMostBuyOrder : ',topMostBuyOrder);
        if(topMostBuyOrder.stoploss>=sellPrice){
            console.log('------------------------------------------------------------------Stoploss hit of buy order : ',topMostBuyOrder);
            pq.pop()

            //check if this order even exists in activeUsers[ownerId].activeBuyOrders
            const ownerId=topMostBuyOrder.ownerId
            if(!activeUsers[ownerId]){
                console.log('user does not exist in activeUsers');
                continue;
            } 
            const activeBuyOrders=activeUsers[ownerId].activeBuyOrders
            const order = activeBuyOrders.find((oneOrder:any)=>oneOrder.orderId==topMostBuyOrder.orderId)
            if(!order){
                console.log('Requested order not found in activeBuyOrders');
                continue;
            }
            
            const soldAmt = topMostBuyOrder.qty*sellPrice
            console.log('Amount genereated after selling the stock is : ',soldAmt);
            console.log();
            const reseredAmt=activeUsers[topMostBuyOrder.owner]?.bal?.usd.reserved
            if(!reseredAmt){
                console.log('user not found in obj');
                break;
            }
            
            activeUsers[topMostBuyOrder.owner].bal.usd.reserved=reseredAmt+soldAmt
            console.log('reserved amt of user increased from  ',reseredAmt,' to ',(reseredAmt+soldAmt));

            // process.exit(1)
        } else {
            console.log('No order yet hit the stoploss');
            break;
        }
    }
}


export async function manageSellPQS(data:any){
    console.log('inside manageSellPQS');
    // console.log('data : ',data);
    const {symbol,buyPrice}=data;
    const pq=sellPQS[symbol]
    if(!pq){
        console.log('Priority queue has not been initialized for symbol : ',symbol);
        return;
    } else if(pq.size()==0){
        console.log('no active SELL orders found for symbol : ',symbol);
        return;
    }

    while(1){
        const bottomMostSellOrder = pq.peek()
        if(!bottomMostSellOrder){
            console.log('no activeSellOrders right now');
            break;
        }
        console.log('bottomMostSellOrder : ',bottomMostSellOrder);
        if(bottomMostSellOrder.stopPrice<=buyPrice){
            console.log('------------------------------------------------------------------stopPrice hit of sell order : ',bottomMostSellOrder);
            pq.pop()
        } else {
            console.log('No order yet hit the stoploss');
            break;
        }
    }
}