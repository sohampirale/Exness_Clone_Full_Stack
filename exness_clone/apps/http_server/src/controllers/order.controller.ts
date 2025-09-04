import type { Request, Response } from "express";
import ApiResponse from "../lib/ApiResponse.js";
import type { ExpressRequest } from "../interfaces/index.js";
import { createClient } from "redis";
import { sellPQS, activeUsers, livePrices, buyPQS, completedSellOrders } from "../variables/index.js";
import {v4 as uuidv4} from "uuid"


import { Heap } from 'heap-js';


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

export async function openOrder(req:ExpressRequest,res:Response){
    try {
        console.log('req.user : ',req.user);
        const {action}=req.query
        if(action=='BUY'){
            const {symbol,qty:qtyStr,stoploss}=req.query;

            if(!buyPQS[symbol]){
                buyPQS[symbol]=new Heap((order1:any,order2:any)=>order2.stoploss-order1.stoploss)
            }

            const qty=Number(qtyStr)
            if(!symbol || !qtyStr || !action || !stoploss){
                return res.status(400).json(
                    new ApiResponse(false,`Invalid data provided`)
                )     
            }
            
            const livePriceData=livePrices.get(symbol);
            const liveBuyPrice =livePriceData?.buyPrice
            console.log('livePriceData : ',livePriceData);
            
            if(!liveBuyPrice){
                return res.status(404).json(
                    new ApiResponse(false,`Live price not found for the symbol : ${symbol}`)
                )        
            }
    
            console.log('liveBuyPrice : ',liveBuyPrice);
            
            const reqBal=liveBuyPrice*qty;
            const reservedBal=activeUsers[req.user.id]?.bal?.usd?.reserved
    
            console.log('reqBal : ',reqBal);
            console.log('reservedBal : ',reservedBal);
            
            if(!reservedBal){
                return res.status(400).json(
                    new ApiResponse(false,`No reserved balance found for the user`)
                )     
            } else if(reservedBal<reqBal){
                
                return res.status(400).json(
                    new ApiResponse(false,`Insufficient reserved balance of the user`)
                )  
            }
            console.log('hey');
            

            const newOrder={
                orderId:uuidv4(),
                action:'BUY',
                symbol,
                price:liveBuyPrice,
                qty,
                stoploss,
                owner:req.user.id
            }

            console.log('hi');

            if(!activeUsers[req.user.id].activeBuyOrders){
                activeUsers[req.user.id].activeBuyOrders=[newOrder]
            } else {
                activeUsers[req.user.id].activeBuyOrders.push(newOrder)
            }
            console.log('updated activeBuyOrders');
            
            activeUsers[req.user.id].bal.usd.reserved=reservedBal-reqBal
            console.log('updated balance of user : ',activeUsers[req.user.id].bal.usd.reserved);
            
            const pq=buyPQS[symbol]
            if(!pq){
                console.log('PQ nto initialized ofr symbol : ',symbol);
            } else {
                console.log('New order pushed into buyPQ of symbol : ',symbol);
                
                pq.push(newOrder)
            }

            return res.status(200).json(
                new ApiResponse(true,"New order created successfully",newOrder)
            )     

        } else if(action=='SELL'){
            const {symbol,qty:qtyStr,margin:marginStr}=req.query;

            if(!sellPQS[symbol]){
                sellPQS[symbol]=new Heap((order1:any,order2:any)=>order1.stopPrice-order2.stopPrice)
            }
            const qty=Number(qtyStr)
            const margin = Number(marginStr)
            if(margin<=0){
                return res.status(400).json(
                   new ApiResponse(false,"Margin cannot be less than 0")
                )
            }

            const livePriceData=livePrices.get(symbol);
            const livePrice=livePriceData.sellPrice;
            const iniReqAmt = (qty*livePrice)+margin
            console.log('Live sell price of ',symbol,' is : ',livePrice);
            const reservedBal=activeUsers[req.user.id]?.bal?.usd?.reserved;
            if(!reservedBal){
                return res.status(404).json(
                    new ApiResponse(false,"No reserved balance foud for this user")
                )   
            } else if(reservedBal<iniReqAmt){
                return res.status(400).json(
                   new ApiResponse(false,`Insufficient balance, Current balance : ${reservedBal}, & maring+minAmt required : ${iniReqAmt}`)
                )
            }

            let stopPrice=(margin/qty)+livePrice
            console.log('stopPrice : ',stopPrice);
            // stopPrice=stopPrice-(stopPrice*0.01)
            // console.log('final stopPrice after decreasing 1% : ',stopPrice);
            const reserved = activeUsers[req.user.id].bal.usd.reserved;
            activeUsers[req.user.id].bal.usd.reserved=reserved-iniReqAmt;
            console.log(`reserved amount of user decreased from ${reserved} to ${reserved-iniReqAmt}`);
            
            const newOrder={
                orderId:uuidv4(),
                owner:req.user.id,
                qty,
                price:livePrice,
                action:"SELL",
                stopPrice,
                margin,
                iniReqAmt
            }

            console.log('newOrder : ',newOrder);
            if(!activeUsers[req.user.id].activeSellOrders){
                activeUsers[req.user.id].activeSellOrders=[newOrder]
            }else{
                activeUsers[req.user.id].activeSellOrders.push(newOrder)
            }

            console.log('Pushed new order into Priority queue of ',symbol);
            
            sellPQS[symbol].push(newOrder)
            console.log('PQ of ',symbol,' : ',sellPQS[symbol]);
            
            return res.status(200).json(
                new ApiResponse(true,"Sell order started successfully")
            )
        } else {
            return res.status(400).json(
                new ApiResponse(false,"Invalid action type specified")
            )
        }
    } catch (error) {
        console.log('ERROR :: openOrder : ',error);
        
        return res.status(500).json(
            new ApiResponse(false,"Failed to start new order",null,error)
        )        
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

export async function closeOrder(req:ExpressRequest,res:Response){
    try {
        const {orderId,action}=req.query;
        const userId = req.user.id;
        if(!orderId || !action){
            return res.status(400).json(
                new ApiResponse(false,"orderId or action is not specified")
            )
        }
        
        if(action=='SELL'){
            const activeBuyOrders=activeUsers[userId].activeBuyOrders
            const index = activeBuyOrders.findIndex((order:any)=>order.orderId==orderId);
            if(index==-1){
                return res.status(404).json(
                    new ApiResponse(false,"Order not active anymore,order might have hit the stoplos")
                )
            }
            const order = activeBuyOrders[index]
            const liveData = livePrices.get(order.symbol)
            if(!liveData){
                return res.status(404).json(
                    new ApiResponse(false,"Live price not found for the symbol : ",order.symbol)
                )
            }
            const liveSellPrice=liveData.sellPrice;
            const sellAmt = order.qty*liveSellPrice
            const reserved=activeUsers[userId]?.bal?.usd?.reserved
            if(reserved || reserved==0){
                activeUsers[userId].bal.usd.reserved=reserved+sellAmt
                console.log('Price of user -',activeUsers[userId].userData?.username,' increased from ',reserved,' to ',(reserved+sellAmt));
                activeBuyOrders.slice(index,1)
            } else {
                return res.status(404).json(
                    new ApiResponse(false,`Wallet not found for user : ${req.user.username}`)
                )
            }
            return res.status(200).json(
                new ApiResponse(true,"Order closed successfully")
            )
        } else if(action=='BUY'){
            
            const activeSellOrders=activeUsers[userId]?.activeSellOrders
            if(!activeSellOrders){
                return res.status(400).json(
                    new ApiResponse(false,`No active sell orders for the user : ${req.user.username}`)
                )
            }
            const index = activeSellOrders.findIndex((order:any)=>order.orderId==orderId)
            if(index==-1){
                return res.status(400).json(
                    new ApiResponse(false,'Order not active,order might have already hit the stopPrice based on margin given')
                )
            }
            const order =activeSellOrders[index]
            const liveData=livePrices.get(order.symbol)
            if(!liveData){
                return res.status(404).json(
                    new ApiResponse(false,`Live price not found for symbol ${order.symbol}`)
                )
            }
            const liveBuyPrice=liveData.buyPrice
            const buyAmt = order.qty*liveBuyPrice;
            const sellAmt = order.qty*order.price
            order.iniReqAmt-=buyAmt

            const reserved=activeUsers[userId]?.bal?.usd?.reserved
            if(!reserved && reserved!=0){
                return res.status(404).json(
                    new ApiResponse(false,`Reserved amt not fou for user : ${req.user.username}`)
                )
            
            } 
            activeUsers[userId].bal.usd.reserved=reserved+order.iniReqAmt+sellAmt
            console.log(`Reserved amt of user : ${req.user.username} increased from ${reserved} to ${reserved+order.iniReqAmt+sellAmt}`);
        
            order.buyPrice=liveBuyPrice
            completedSellOrders.push(order)
            activeSellOrders.splice(index,1)
            return res.status(200).json(
                new ApiResponse(true,`Sell order closed successfully`)
            )
        }

    } catch (error) {
        return res.status(500).json(
            new ApiResponse(false,`Failed to close the order`)
        )
    }
}