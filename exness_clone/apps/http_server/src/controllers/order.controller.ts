import type { Request, Response } from "express";
import ApiResponse from "../lib/ApiResponse.js";
import type { ExpressRequest } from "../interfaces/index.js";
import { createClient } from "redis";
import { sellPQS, activeUsers, livePrices, buyPQS } from "../variables/index.js";
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
            console.log('Live sell price of ',symbol,' is : ',livePrice);
            const reservedBal=activeUsers[req.user.id]?.bal?.usd?.reserved;
            if(!reservedBal){
                return res.status(404).json(
                    new ApiResponse(false,"No reserved balance foud for this user")
                )   
            } else if(reservedBal<margin){
                return res.status(400).json(
                   new ApiResponse(false,"Insufficient balance, CUrrent balance : ",reservedBal)
                )
            }

            let stopPrice=(margin/qty)+livePrice
            console.log('stopPrice : ',stopPrice);
            // stopPrice=stopPrice-(stopPrice*0.01)
            // console.log('final stopPrice after decreasing 1% : ',stopPrice);
            activeUsers[req.user.id].bal.usd.reserved-=margin;
            const newOrder={
                orderId:uuidv4(),
                owner:req.user.id,
                qty,
                price:livePrice,
                action:"SELL",
                stopPrice,
                margin
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