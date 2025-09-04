import { activeUsers, buyPQS, livePrices, sellPQS } from "../variables/index.js";

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
            /**
             * 1.fetch the order form activeUsers[order.owner].activeSellOrders if not found continue
             * 1.calculate buyAmt (livePrice * order.qty) [maybe unnessesary]
             * 2.calculate sellAmt (the amt user deserves because of selling at order.qty * order.price)
             * 3.add the sellAmt in the activeUsers[order.owner].bal.usd.reserved
             * 4.add field buyPrice = liveBuyPrice
             * 5.remove that order from the activeSellOrders
             */
            const activeSellOrders=activeUsers[bottomMostSellOrder.owner]?.activeSellOrders
            const index=activeSellOrders.findIndex((order:any)=>order.orderId==bottomMostSellOrder.orderId)
            if(index==-1){
                console.log('This sell order is already closed by user before hitting the stopPrice');
                continue
            }

            if(!activeSellOrders)continue

            const liveData=livePrices.get(bottomMostSellOrder.symbol)
            const liveBuyPrice = liveData.buyPrice
            const buyAmt = liveBuyPrice*bottomMostSellOrder.qty
            const sellAmt=bottomMostSellOrder.qty*bottomMostSellOrder.price
            const reserved = activeUsers[bottomMostSellOrder.owner]?.bal?.usd?.reserved
            if(!reserved && reserved!=0){
                console.log(`Reserved amt not foud for userId : ${bottomMostSellOrder.owner}`);
                continue;
            }
            
            activeUsers[bottomMostSellOrder.owner].bal.usd.reserved=reserved+sellAmt
            console.log(`reserved amt of user : ${activeUsers[bottomMostSellOrder.owner]?.userData?.username} increased from ${reserved} to ${reserved+sellAmt}`);
            bottomMostSellOrder.buyPrice=liveBuyPrice
            activeSellOrders.splice(index,1)
            
        } else {
            console.log('No order yet hit the stoploss');
            break;
        }
    }
}