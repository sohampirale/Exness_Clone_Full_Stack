import type { Request, Response } from "express";
import ApiResponse from "../lib/ApiResponse.js";
import type { ExpressRequest } from "../interfaces/index.js";
import { createClient } from "redis";
import { activeUsers, livePrices } from "../variables/index.js";
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
 * 4.put that amout into liveUsers[req.user.id].bal.usd.
 */

export async function openOrder(req:ExpressRequest,res:Response){
    try {
        console.log('req.user : ',req.user);
        const {symbol,qty:qtyStr,action,stoploss}=req.query;
        if(action=='BUY'){
            if(!symbol || !qtyStr || !action || !stoploss){
                return res.status(400).json(
                    new ApiResponse(false,`Invalid data provided`)
                )     
            }
    
            const qty=Number(qtyStr)
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
            
            return res.status(200).json(
                new ApiResponse(true,"New order created successfully",newOrder)
            )     

        } else if(action=='SELL'){
            return res.status(200).json(
                new ApiResponse(true,"In process...")
            )
        } else {
            return res.status(400).json(
                new ApiResponse(false,"Invalid action type specified")
            )
        }
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(false,"Failed to start new order",null,error)
        )        
    }
}