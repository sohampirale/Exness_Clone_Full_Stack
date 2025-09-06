import Heap from "heap-js";
import { activeUsers, buyPQS, completedLeverageBuyOrders, completedLeverageSellOrders, completedSellOrders, leverageBuyPQS, leverageSellPQS, livePrices, maxLeverageScale, sellPQS } from "../variables";
import {v4 as uuidv4} from "uuid"


/**
 * action == 'BUY'
 * 1.retrive the symbol,qty,action,stoploss from query 
 * 2.retrive the current live price of that symbol 
 * 3.calculate the required amount for the qty specified by the user
 * 4.check if activerUsers[req.user.id].bal.usd.reserved > required amout for buying that stock if not reject -insufficient balance to buy this qty
 * 5.reduce that amout from reserved amout and create new order(unique orderId) and push it into activeUsers[req.user.id].activeBuyOrders
 * 6. :TODO push that order into priority queue for the stoploss management 
 * 7.return res
 * 
 * action == 'SELL'
 * 1.retrive the symbol,qty,action,margin
 * 2.retrive the currenty live price of that symbol
 * 3.calculate the amount that is allocated for user (livePrice*qty)
 * 4.check if the margin mentioned by user is less tha what he actualy has in reserved as well as greater than 0
 * 5.calculate the stoppoint for that order (margin/qty)+price(live price of that stock)
 * 6.substract the margin from reserved amount and put that margin into newOrder object
 * 7.create the newOrder object and push it onto the queue
 * 8.push that newOrder into activeUsers[req.user.id].activeSellOrders
 * 9.Return response
 */

export async function openOrder(order:any){

    const {action,owner,orderId} = order

    try {

        if(action=='BUY'){
            const {symbol,qty:qtyStr,stoploss:stoplossStr}=order;

            if(!buyPQS[symbol]){
                buyPQS[symbol]=new Heap((order1:any,order2:any)=>order2.stoploss-order1.stoploss)
            }
            const qty=Number(qtyStr)
            const stoploss=Number(stoplossStr)

            if(!symbol || !qty || !action || !stoploss){
                //TODO  1.rejecting the order completely 
                //2.publishing notification to pub sub on "orders_executed"
            }

            
            const livePriceData=livePrices.get(symbol);
            const liveBuyPrice =livePriceData?.buyPrice
            console.log('livePriceData : ',livePriceData);
            
            if(!liveBuyPrice){
                //TODO
                // return res.status(404).json(
                //     new ApiResponse(false,`Live price not found for the symbol : ${symbol}`)
                // )        
            }
    
            console.log('liveBuyPrice : ',liveBuyPrice);
            
            const reqBal=liveBuyPrice*qty;
            const reservedBal=activeUsers[owner]?.bal?.usd?.reserved
    
            console.log('reqBal : ',reqBal);
            console.log('reservedBal : ',reservedBal);
            
            if(!reservedBal){
                //TODO
                // return res.status(400).json(
                //     new ApiResponse(false,`No reserved balance found for the user`)
                // )     
            } else if(reservedBal<reqBal){
               //TODO 
                // return res.status(400).json(
                //     new ApiResponse(false,`Insufficient reserved balance of the user`)
                // )  
            }
            console.log('hey');
            

            const newOrder={
                orderId,
                action:'BUY',
                symbol,
                price:liveBuyPrice,
                qty,
                stoploss,
                owner:owner
            }


            if(!activeUsers[owner].activeBuyOrders){
                activeUsers[owner].activeBuyOrders=[newOrder]
            } else {
                activeUsers[owner].activeBuyOrders.push(newOrder)
            }
            console.log('updated activeBuyOrders');
            
            activeUsers[owner].bal.usd.reserved=reservedBal-reqBal
            console.log('updated balance of user : ',activeUsers[owner].bal.usd.reserved);
            
            const pq=buyPQS[symbol]
            if(!pq){
                console.log('PQ not initialized for symbol : ',symbol);
            } else {
                console.log('New order pushed into buyPQ of symbol : ',symbol);
                
                pq.push(newOrder)
            }

            //TODO
            //1.pushing onto notifications queue 
            //2.pushing info onto pub sub "orders_executed"
            // return res.status(200).json(
            //     new ApiResponse(true,"New order created successfully",newOrder)
            // )     

        } else if(action=='SELL'){
            const {symbol,qty:qtyStr,margin:marginStr}=order;

            if(!sellPQS[symbol]){
                sellPQS[symbol]=new Heap((order1:any,order2:any)=>order1.stopPrice-order2.stopPrice)
            }
            const qty=Number(qtyStr)
            const margin = Number(marginStr)
            if(margin<=0){
                //TODO
                // return res.status(400).json(
                //    new ApiResponse(false,"Margin cannot be less than 0")
                // )
            }

            const livePriceData=livePrices.get(symbol);
            const livePrice=livePriceData.sellPrice;
            const iniReqAmt = (qty*livePrice)+margin
            console.log('Live sell price of ',symbol,' is : ',livePrice);
            const reservedBal=activeUsers[owner]?.bal?.usd?.reserved;

            if(!reservedBal){
                //TODO
                // return res.status(404).json(
                //     new ApiResponse(false,"No reserved balance foud for this user")
                // )   
            } else if(reservedBal<iniReqAmt){
                //TODO
                // return res.status(400).json(
                //    new ApiResponse(false,`Insufficient balance, Current balance : ${reservedBal}, & maring+minAmt required : ${iniReqAmt}`)
                // )
            }

            let stopPrice=(margin/qty)+livePrice
            console.log('stopPrice : ',stopPrice);
            // stopPrice=stopPrice-(stopPrice*0.01)
            // console.log('final stopPrice after decreasing 1% : ',stopPrice);
            const reserved = activeUsers[owner].bal.usd.reserved;
            activeUsers[owner].bal.usd.reserved=reserved-iniReqAmt;
            console.log(`reserved amount of user decreased from ${reserved} to ${reserved-iniReqAmt}`);
            
            const newOrder={
                orderId:uuidv4(),
                owner:owner,
                qty,
                price:livePrice,
                action:"SELL",
                stopPrice,
                margin,
                iniReqAmt
            }

            console.log('newOrder : ',newOrder);
            if(!activeUsers[owner].activeSellOrders){
                activeUsers[owner].activeSellOrders=[newOrder]
            }else{
                activeUsers[owner].activeSellOrders.push(newOrder)
            }

            console.log('Pushed new order into Priority queue of ',symbol);
            
            sellPQS[symbol].push(newOrder)
            console.log('PQ of ',symbol,' : ',sellPQS[symbol]);
            
            //TODO
            // return res.status(200).json(
            //     new ApiResponse(true,"Sell order started successfully")
            // )
        } else {
            //TODO
            // return res.status(400).json(
            //     new ApiResponse(false,"Invalid action type specified")
            // )
        }
    } catch (error) {
        console.log('ERROR :: openOrder : ',error);
        
        //TODO (also might want to execute this order again)
        // return res.status(500).json(
        //     new ApiResponse(false,"Failed to start new order",null,error)
        // )        
    }
}



/**
 * 1.retrive the orderId and action from query
 * 
 * action == 'BUY'
 * 2.find out that order from activeUsers[userId].activeSellOrders if not found reject - order might have alreay hit the stopPrice based on margi9n you provided
 * 3.calulate the buyAmt order.qty*livePrice
 * 4.calculate sellAmt the amt the user deserves for shorting a stock at (order.qty*order.price)
 * 5.substract the buyAmt from order.iniReqAmt
 * 6.add the sellAmt + order.iniReqAmt into activeUsers[userId].bal.usd.reserved
 * 7.add one filed buyPrice into order 
 * 8.push this order into completed sell orders
 * 9.remove the order from activeSellOrders
 * 10.return response
 * 
 * action =='SELL'
 * 2.find out that order from activeUsers[userId].activeBuyOrders if not foud rejecr - order not found, order might have hit stoploss and closed itself
 * 3.calculate sellAmt = order.qty*livePrice
 * 4.add that sellAmt in the activeUsers[userId].bal.usd.reserved+=
 * 5.remove the order from the activeBuyOrders array as well as (if possible from buyPQS[optional])
 * 6.add one field sellPrice into order
 * 7.push the order inot completedBuyOrders
 * 8.return response
 */

export async function closeOrder(order:any){
    try {
        const {orderId,action,owner}=order;
        const userId = owner;

        if(!orderId || !action){
            //TODO
            // return res.status(400).json(
            //     new ApiResponse(false,"orderId or action is not specified")
            // )
        }
        
        if(action=='SELL'){
            const activeBuyOrders=activeUsers[userId].activeBuyOrders
            const index = activeBuyOrders.findIndex((order:any)=>order.orderId==orderId);
            if(index==-1){
                //TODO
                // return res.status(404).json(
                //     new ApiResponse(false,"Order not active anymore,order might have hit the stoplos")
                // )
            }

            const order = activeBuyOrders[index]
            const liveData = livePrices.get(order.symbol)
            if(!liveData){
                //TODO
                // return res.status(404).json(
                //     new ApiResponse(false,"Live price not found for the symbol : ",order.symbol)
                // )
            }

            const liveSellPrice=liveData.sellPrice;
            const sellAmt = order.qty*liveSellPrice
            const reserved=activeUsers[userId]?.bal?.usd?.reserved
            if(reserved || reserved==0){
                activeUsers[userId].bal.usd.reserved=reserved+sellAmt
                console.log('Price of user -',activeUsers[userId].userData?.username,' increased from ',reserved,' to ',(reserved+sellAmt));
                activeBuyOrders.slice(index,1)
            } else {
                //TODO
                // return res.status(404).json(
                //     new ApiResponse(false,`Wallet not found for user : ${req.user.username}`)
                // )
            }

            //TODO
            // return res.status(200).json(
            //     new ApiResponse(true,"Order closed successfully")
            // )
        } else if(action=='BUY'){
            
            const activeSellOrders=activeUsers[userId]?.activeSellOrders
            if(!activeSellOrders){
                //TODO
                // return res.status(400).json(
                //     new ApiResponse(false,`No active sell orders for the user : ${req.user.username}`)
                // )
            }
            const index = activeSellOrders.findIndex((order:any)=>order.orderId==orderId)
            if(index==-1){
                //TODO
                // return res.status(400).json(
                //     new ApiResponse(false,'Order not active,order might have already hit the stopPrice based on margin given')
                // )
            }
            const order =activeSellOrders[index]
            const liveData=livePrices.get(order.symbol)
            if(!liveData){
                //TODO
                // return res.status(404).json(
                //     new ApiResponse(false,`Live price not found for symbol ${order.symbol}`)
                // )
            }
            const liveBuyPrice=liveData.buyPrice
            const buyAmt = order.qty*liveBuyPrice;
            const sellAmt = order.qty*order.price
            order.iniReqAmt-=buyAmt

            const reserved=activeUsers[userId]?.bal?.usd?.reserved
            if(!reserved && reserved!=0){
                //TODO
                // return res.status(404).json(
                //     new ApiResponse(false,`Reserved amt not fou for user : ${req.user.username}`)
                // )
            
            } 
            activeUsers[userId].bal.usd.reserved=reserved+order.iniReqAmt+sellAmt
            console.log(`Reserved amt of user : ${req.user.username} increased from ${reserved} to ${reserved+order.iniReqAmt+sellAmt}`);
        
            order.buyPrice=liveBuyPrice
            completedSellOrders.push(order)
            activeSellOrders.splice(index,1)

            //TODO
            // return res.status(200).json(
            //     new ApiResponse(true,`Sell order closed successfully`)
            // )
        }

    } catch (error) {
        //TODO

        // return res.status(500).json(
            // new ApiResponse(false,`Failed to close the order`)
        // )
    }
}

//open order with leverage
/**
 * BUY
 * 1.calculate required amt (liveBuyPrice*qty)
 * 2.compare the margin with the reqAmt if greater than 10x reject - only 10x till leverage is supported
 * 3.bhakti>>
 * 3.check if margin is greater than reserved
 * 4.substract the margin from activeUsers[userId].bal.usd.reserved
 * 5.calculate stoplossBE = liveBuyPrice-(maring/qty)
 * 6.if stoploss not given from user use the stoplossBE
 * 6.check if stoploss given by client is below the stoplossBE if yes reject - stoploss goes below the max stoploss limit based upon margin allocated
 * 7.if not then use the stoplossgiven by user
 * 8.place the buy order
 * 9.push it onto leverageBuyPQS
 * 10.push it onto the activeLeverageBuyOrders of activeUsers[userId]
 * 11.return response
 * 
 * SELL
 * 1.retrive the symbol,qty ,margin ,stopPrice from the query
 * 2.calculate current borrowedAmt(qty*liveBuyPrice) thatis going to be borrowed from exness
 * 3.check if the current reserved balance of user is greater than margin mentioned if not reject - insufficient balance for margin
 * 4.calculate ratio of borrowedAmt/margin if its greater than maxMarginScale reject - this platform allows maxMarginScale
 * 5.Substract the margin from reserved balance of user
 * 6.calculate stopPriceBE (margin/qty)+liveBuyPrice
 * 7.if give stopPrice from user goes above stopPriceBE reject - margin exceeds the stopPrice based on allocated margin,increase margin or decrease stopPrice
 * 8.create the order (margin,leverage stopPrice:finalStopPrice min.)
 * 9.push the order into leverageSellPQS
 * 10.push the order into activeUsers[userId].activeLeverageSellOrders
 * 11.return response
 */

export async function openLeverageOrder(order:any){
    try {
        const {action,owner,orderId} = order;
        const userId=owner

        if(action=='BUY'){
            const {symbol,qty:qtyStr,stoploss:stoplossStr,margin:marginStr}=owner;
            if(!leverageBuyPQS[symbol]){
                leverageBuyPQS[symbol]=new Heap((order1:any,order2:any)=>order2.stoploss-order1.stoploss)
            }
            const stoploss=Number(stoplossStr)
            const qty=Number(qtyStr)
            const margin=Number(marginStr)
            const userId = owner;
            if(!userId){
            //TODO
                // return res.status(400).json(
                //     new ApiResponse(false,"userId not found, unauthorized")
                // )
            } else if(!symbol || !qty ){

                console.log(`Symbol or qty not provided in the request`);
            //TODO

                // return res.status(400).json(
                //     new ApiResponse(false,"symbol or quantity not provided in the request")
                // )
            }

            const liveData=livePrices.get(symbol)
            if(!liveData){
                return res.status(404).json(
                    new ApiResponse(false,`Live data not foud for symbol : ${symbol}`)
                )
            }

            const {buyPrice:liveBuyPrice,sellPrice:liveSellPrice} = liveData

            const buyAmt = qty * liveBuyPrice
            const leverageScale = buyAmt/margin
            if(leverageScale>maxLeverageScale){
                //TODO
                // return res.status(400).json(
                //     new ApiResponse(false,`This platform only supports upto ${maxLeverageScale}X leverage,reduce qty or increase margin`)
                // )
            }

            const reserved = activeUsers[userId]?.bal?.usd?.reserved
            if(!reserved){
            //TODO

                // return res.status(400).json(
                //     new ApiResponse(false,`Reserved amout not foud for the user : ${req.user.username}`)
                // )
            }

            if(reserved<margin){
                //TODO
                // return res.status(400).json(
                //     new ApiResponse(false,`Insufficient marin amount, current tradable balance : ${reserved}`)
                // )
            }

            activeUsers[userId].bal.usd.reserved=reserved-margin

            const stoplossBE=liveSellPrice-(margin/qty)
            let finalStoploss;
            
            if(stoploss){
                if(stoploss<stoplossBE){
                    //TODO
                    // return res.status(400).json(
                    //     new ApiResponse(false,"Stoploss given by you excceed the margin coverage limit,decrease stoploss or increase margin")
                    // )
                } else {
                    finalStoploss=stoploss
                }
            } else {
                finalStoploss=stoplossBE
            }

            const order ={
                orderId,
                action:"BUY",
                qty,
                symbol,
                price:liveBuyPrice,
                margin,
                stoploss:finalStoploss,
                owner:userId
            }

            leverageBuyPQS[symbol].push(order)
            if(!activeUsers[userId].activeLeverageBuyOrders){
                activeUsers[userId].activeLeverageBuyOrders=[order]
            } else {
                activeUsers[userId].activeLeverageBuyOrders.psuh(order)
            }

            //TODO

            // return res.status(201).json(
            //     new ApiResponse(true,`Leverage buy order placed successfully`)
            // )
        } else if(action=='SELL'){
            const {symbol,qty:qtyStr,margin:marginStr,stopPrice:stopPriceStr}=order
            const margin=Number(marginStr)
            const stopPrice = Number(stopPriceStr)
            const qty=Number(qtyStr)
            if(margin==0){
                // return res.status(400).json(
                //     new ApiResponse(false,`Margin cannot be 0`)
                // )
            }else if(!margin || !qty || !symbol){
                // return res.status(400).json(
                //     new ApiResponse(false,`Invalid data provided,margin quantity and symbol in required`)
                // )
            }

            const liveData=livePrices.get(symbol)
            if(!liveData){
                // return res.status(404).json(
                //     new ApiResponse(false,`Liev data not foud for symbol : ${symbol}`)
                // )
            }
            if(!leverageSellPQS[symbol]){
                leverageBuyPQS[symbol]=new Heap((order1:any,order2:any)=>order1.stopPrice-order2.stopPrice)
            }
            const{ buyPrice:liveBuyPrice,sellPrice:liveSellPrice}=liveData

            const borrowedAmt = qty*liveBuyPrice
            const reserved=activeUsers[userId]?.bal?.usd?.reserved
            if(!reserved){
                // return res.status(500).json(
                //     new ApiResponse(false,`Reserved balance not found for user : ${req.user.username}`)
                // )
            } else if(reserved<margin){
                // return res.status(400).json(
                //     new ApiResponse(false,`Insufficient balance, current balance : ${reserved}`)
                // )
            }

            const leverageScale = borrowedAmt/margin
            if(leverageScale>maxLeverageScale){
                // return res.status(400).json(
                //     new ApiResponse(false,`This platform supports maximum upto 10x leverage,increase margin or decrease quantity`)
                // )
            }
            const stopPriceBE = liveBuyPrice+(margin/qty)
            let finalStopPrice=stopPriceBE
            if(stopPrice){
                if(stopPrice>stopPriceBE){
                    // return res.status(400).json(
                    //    new ApiResponse(false,`Stopprice exceeds the max stopPrice based on allocated margin,increase margin or decrease stoploss`)
                    // )
                } else {
                    finalStopPrice=stopPrice
                }
            }
            activeUsers[userId].bal.usd.reserved=reserved-margin
            const orderId=uuidv4()
            console.log(`Borrowed : ${borrowedAmt} from exness for orderId : ${orderId}`);
            const newOrder ={
                orderId,
                owner:userId,
                qty,
                price:liveSellPrice,
                margin,
                leverage:borrowedAmt,
                stopPrice:finalStopPrice,
                action:'SELL'
            }

            leverageSellPQS[symbol].push(newOrder)
            if(!activeUsers[userId].activeLeverageSellOrders){
                activeUsers[userId].activeLeverageSellOrders=[newOrder]
            } else {
                activeUsers[userId].activeLeverageSellOrders.push(newOrder)
            }

            // return res.status(201).json(
            //     new ApiResponse(true,`Leverage sell order started successfully`)
            // )

        }else {
            // return res.status(400).json(
            //     new ApiResponse(false,`Invalid action type specified`)
            // )
        }
    } catch (error) {
        // return res.status(500).json(
        //     new ApiResponse(false,`Failed to place leverage buy order`)
        // )
    }
}

/**
 * 
 * SELL
 * 1.retrive orderId
 * 2.find that order from activeUsers[userId].activeLeverageBuyOrders if not found reject - order already closed or auto closed because of stoploss
 * 3.calculate sellAmt = order.qty*liveSellPrice
 * 4.calculate buyAmt = order.qty*order.price
 * 5.calcultae borrowedAmt = buyAmt - order.margin
 * 6.calculate userProfit = sellAmt - borrowedAmt
 * 9.add title sellPrice to the order
 * 7.add the userProfit in the reserved bal of user
 * 8.remove the order from the activeLeverageBuyOrders
 * 10.psuh the order onto closedLeverageBuyOrders
 * 11.return response
 * 
 * BUY
 * 1.retivr the orderId
 * 2.retrivethe order from activeLeverageSellOrders  if not foud reject - order already closed manually or automatically closed due to stopPrice hit
 * 3.calculate reservedBuyAmt = order.leverage + order.margin
 * 4.calculate buyAmt = order.qty*liveBuyPrice
 * 5.calculate remainningReservedBuyAmt = reservedBuyAmt - buyAmt
 * 6.calculate sellAmt = order.qty * order.price
 * 7.calculate netSellAmt = sellAmt + remainningReservedBuyAmt
 * 8.calculate netUserProfit = netSellAmt - order.leverage
 * 9.remove the order from activeLeverageSellOrders
 * 10.add the netUserProfit into reserved balance of user
 * 11.add new field buyPrice:liveBuyPrice in the order obj
 * 12.push the order into compltedLeverageSellOrders
 * 13.return response
 */
export async function closeLeverageOrder(order:any){
    try {
        const {action,orderId,owner}=order;
        if(orderId){
            // return res.status(400).json(
            //     new ApiResponse(false,`Order id not found inside query`)
            // )
        }
        const userId=owner;
        if(action=='BUY'){
            const activeLeverageSellOrders=activeUsers[userId]?.activeLeverageSellOrders
            if(!activeLeverageSellOrders){
                // return res.status(404).json(
                //     new ApiResponse(false,`No active leverage sell orders found,order is already closed manually or automatically closed due to stopPrice hit`)
                // )
            }
            const index = activeLeverageSellOrders.findIndex((order:any)=>order.orderId==orderId)
            if(index==-1){
                // return res.status(404).json(
                //     new ApiResponse(false,`Order not found,order is already closed manually or automatically closed due to stopPrice hit or invalid order Id`)
                // )
            }
            const order = activeLeverageSellOrders[index]
            const reservedBuyAmt=order.leverage + order.margin
            const liveData=livePrices.get(order.symbol)
            if(!liveData){
                // return res.status(500).json(
                //     new ApiResponse(false,`Live data not found for symbol : ${order.symbol}`)
                // )
            }
            const {buyPrice:liveBuyPrice}=liveData
            const buyAmt = order.qty * liveBuyPrice
            const remainningReservedBuyAmt=reservedBuyAmt-buyAmt
            const sellAmt = order.qty * order.price

            const netSellAmt=sellAmt+remainningReservedBuyAmt
            const netUserProfit=netSellAmt-order.leverage
            console.log(`Returned the amout borrowed from exness : ${order.leverage}`);
            const reserved = activeUsers[userId]?.bal?.usd?.reserved
            
            if(!reserved && reserved!=0){
                // return res.status(400).json(
                //     new ApiResponse(false,`Reserved amout not found for user : ${req.user.username}`)
                // )
            }
            
            activeUsers[userId].bal.usd.reserved = reserved + netUserProfit
            console.log(`Reserved amout of user : ${req.user.username} increased from ${reserved} to ${reserved+netUserProfit}`);
            
            order.buyPrice=liveBuyPrice
            activeLeverageSellOrders.splice(index,1)
            completedLeverageSellOrders.push(order)

            // return res.status(200).json(
            //     new ApiResponse(true,`Leverage sell order closed successfully`)
            // )
            
        }else if(action=='SELL'){
            const activeLeverageBuyOrders = activeUsers[userId]?.activeLeverageBuyOrders

            const index = activeLeverageBuyOrders.findIndex((order:any)=>order.orderId==orderId)
            if(index==-1){
                // return res.status(400).json(
                //     new ApiResponse(false,`This buy order is already closed by you or cloed automatically because of stoploss`)
                // )
            }
            const order =activeLeverageBuyOrders[index]

            const liveData=livePrices.get(order.symbol)
            if(!liveData){
                // return res.status(500).json(
                //     new ApiResponse(false,`live data not foud for the symbol : ${order.symbol}`)
                // )
            }
            const liveSellPrice=liveData.sellPrice
            const sellAmt = liveSellPrice * order.qty
            const buyAmt = order.qty * order.price

            const borrowedAmt = buyAmt-order.margin
            const userProfit = sellAmt-borrowedAmt

            console.log(`Returning borrowed amt from exness : ${borrowedAmt}`);
            console.log(`userprofit from this leverage buy order : ${userProfit}`);

            order.sellPrice=liveSellPrice
            const reserved = activeUsers[userId]?.bal?.usd?.reserved

            if(!reserved && reserved!=0){
                console.log(`Reserved var not fou for user : ${activeUsers[userId]?.userData?.username}`);
                // return res.status(404).json(
                //     new ApiResponse(false,`Reserved varibale not found for the user : ${activeUsers[userId]?.userData.username}`)
                // )
            }
            
            activeUsers[userId].bal.usd.reserved=reserved+userProfit
            console.log(`balance of user ${activeUsers[userId]?.userData?.username} increased from ${reserved} to ${reserved+userProfit}`);
            activeLeverageBuyOrders.splice(index,1)

            completedLeverageBuyOrders.push(order)

            // return res.status(200).json(
            //     new ApiResponse(true,`Leverage buy order closed successfully`)
            // )
        }else {
            // return res.status(400).json(
            //     new ApiResponse(false,`Invalid action type specified`)
            // )
        }
    } catch (error) {
        // return res.status(500).json(
        //     new ApiResponse(false,`Failed to close the leverage order`)
        // )
    }
}
