import type { Request, Response } from "express";
import ApiResponse from "../lib/ApiResponse.js";
import type { ExpressRequest } from "../interfaces/index.js";
import { createClient } from "redis";


let subscriber;
try {
    subscriber = createClient({url:process.env.REDIS_DB_URL!});
    subscriber.connect();
    console.log('Redis DB connected successfully');
    subscriber.subscribe("BTCUSDT",(data)=>{
        console.log('data receievd from pub sub for BTCUSDT is : ',data);
        
    })
} catch (error) {
    console.log('Failed to connect to Redis DB');
}



/**
 * action == 'BUY'
 * 1.retrive the symbol,qty,action,stoploss from query 
 * 2.retrive the current live price of that symbol 
 * 3.calculate the required amount for the qty specified by the user
 * 4.check if activerUsers[req.user.id].bal.usd.reserved > required amout for buying that stock if not reject -insufficient balance to buy this qty
 * 5.reduce that amout from reserved amout and create new order(unique orderId) and push it into activeUsers[req.user.id].activeBuyOrders
 * 6.push that order into priority queue for the stoploss management
 * 7.
 */


export async function openOrder(req:ExpressRequest,res:Response){
    try {
        console.log('req.user : ',req.user);
        const {symbol,qty,action,stoploss}=req.query;
        return res.status(200).json(
            new ApiResponse(true,"Hey there")
        )     
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(false,"Failed to start new order")
        )        
    }
}