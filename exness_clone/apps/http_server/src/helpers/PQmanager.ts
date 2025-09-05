import { activeUsers, buyPQS, completedBuyOrders, completedLeverageBuyOrders, completedLeverageSellOrders, completedSellOrders, leverageBuyPQS, livePrices, sellPQS } from "../variables/index.js";

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
            completedBuyOrders.push(topMostBuyOrder)
            // process.exit(1)
        } else {
            console.log('No buy order yet hit the stoploss');
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
            if(!activeSellOrders)continue
            const index=activeSellOrders.findIndex((order:any)=>order.orderId==bottomMostSellOrder.orderId)
            if(index==-1){
                console.log('This sell order is already closed by user before hitting the stopPrice');
                continue
            }


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
            completedSellOrders.push(bottomMostSellOrder)
        } else {
            console.log('No sell order yet hit the stopPrice');
            break;
        }
    }
}

export async function manageLeverageBuyPQS(data:any){
     console.log('inside manageLeverageBuyPQS');
    // console.log('data : ',data);
    const {symbol,sellPrice}=data;
    const pq=leverageBuyPQS[symbol]

    if(!pq){
        console.log('Priority queue has not been initialized for symbol : ',symbol);
        return;
    } else if(pq.size()==0){
        console.log('no active Buy orders found for symbol : ',symbol);
        return;
    }
  
    while(1){
        const topMostLeverageBuyOrder = pq.peek()
        if(!topMostLeverageBuyOrder){
            console.log('no activeLeverageBuyOrders right now');
            break;
        }
        console.log('topMostLeverageBuyOrder : ',topMostLeverageBuyOrder);

        if(topMostLeverageBuyOrder.stoploss>=sellPrice){

            console.log('------------------------------------------------------------------Stoploss hit of leverage buy order : ',topMostLeverageBuyOrder);
            pq.pop()

            //check if this order even exists in activeUsers[ownerId].activeLeverageBuyOrders
            const ownerId=topMostLeverageBuyOrder.ownerId
            
            if(!activeUsers[ownerId]){
                console.log('user does not exist in activeUsers');
                continue;
            } 

            const activeLeverageBuyOrders=activeUsers[ownerId].activeLeverageBuyOrders;

            const index = activeLeverageBuyOrders.findIndex((oneOrder:any)=>oneOrder.orderId==topMostLeverageBuyOrder.orderId)

            if(index==-1){
                console.log('Requested order not found in activeLeverageBuyOrders, order might be already closed by user before hittign stoploss');
                continue;
            }
            const order =activeLeverageBuyOrders[index]
            
            activeLeverageBuyOrders.splice(index,1)
            console.log(`user ${activeUsers[order.owner].userData.username} has lot 100% of his margin on the order ${order}`);
            completedLeverageBuyOrders.push(topMostLeverageBuyOrder)
        } else {
            console.log('No leverage buy order yet hit the stoploss');
            break;
        }
    }
}

export async function manageLeverageSellPQS(data:any){
    console.log('inside manageLeverageSellPQS');
    // console.log('data : ',data);
    const {symbol,buyPrice}=data;
    const pq=sellPQS[symbol]
    if(!pq){
        console.log('Priority queue has not been initialized for symbol : ',symbol);
        return;
    } else if(pq.size()==0){
        console.log('no active leverage SELL orders found for symbol : ',symbol);
        return;
    }

    while(1){
        const bottomMostLeverageSellOrder = pq.peek()
        if(!bottomMostLeverageSellOrder){
            console.log('no activeSellOrders right now');
            break;
        }
        console.log('bottomMostLeverageSellOrder : ',bottomMostLeverageSellOrder);
        if(bottomMostLeverageSellOrder.stopPrice<=buyPrice){
            console.log('------------------------------------------------------------------stopPrice hit of sell order : ',bottomMostLeverageSellOrder);
            pq.pop()
            /**
             * 1.fetch the order form activeUsers[order.owner].activeLeverageSellOrders if not found continue
             * 1.calculate reservedBuyAmt (order.margin + order.leverage) [maybe unnessesary]
             * 2.calculate buyAmt = order.qty*liveBuyPrice 
             * 3.calculate remainningReservedBuyAmt = reservedBuyAmt - buyAmt
             * 4.calculate sellAmt = (order.qty * order.price)
             * 5.calculate netSellAmt = sellAmt + remainningReservedBuyAmt
             * 6.calculate usnetUserProfit = netSellAmt - leverage
             * 7.add the netUserProfit into reserved amount of user
             * 8.remove the order from activeLeverageSellOrders
             * 9.continue;
             */
            const activeLeverageSellOrders=activeUsers[bottomMostLeverageSellOrder.owner]?.activeSellOrders
            if(!activeLeverageSellOrders)continue

            const index=activeLeverageSellOrders.findIndex((order:any)=>order.orderId==bottomMostLeverageSellOrder.orderId)
            if(index==-1){
                console.log('This sell order is already closed by user before hitting the stopPrice');
                continue
            }



            const liveData=livePrices.get(bottomMostLeverageSellOrder.symbol)
            const liveBuyPrice = liveData.buyPrice
            const reservedBuyAmt = bottomMostLeverageSellOrder.margin + bottomMostLeverageSellOrder.leverage
            const buyAmt = bottomMostLeverageSellOrder.qty*liveBuyPrice
            const remainningReservedBuyAmt = reservedBuyAmt-buyAmt
            const sellAmt = bottomMostLeverageSellOrder.qty * bottomMostLeverageSellOrder.price
            const netSellAmt = sellAmt + remainningReservedBuyAmt
            const netUserProfit = netSellAmt-bottomMostLeverageSellOrder.leverage

            const reserved = activeUsers[bottomMostLeverageSellOrder.owner]?.bal?.usd?.reserved

            if(!reserved && reserved!=0){
                console.log(`Reserved amt not foud for userId : ${bottomMostLeverageSellOrder.owner}`);
                continue;
            }
            
            activeUsers[bottomMostLeverageSellOrder.owner].bal.usd.reserved=reserved+netUserProfit

            console.log(`Returned borrowed amout from exness : ${bottomMostLeverageSellOrder.leverage}`);
            
            console.log(`reserved amt of user : ${activeUsers[bottomMostLeverageSellOrder.owner]?.userData?.username} increased from ${reserved} to ${reserved+netUserProfit}`);

            bottomMostLeverageSellOrder.buyPrice=liveBuyPrice
            activeLeverageSellOrders.splice(index,1)
            completedLeverageSellOrders.push(bottomMostLeverageSellOrder)

        } else {
            console.log('No leverage sell order yet hit the stopPrice');
            break;
        }
    }
}