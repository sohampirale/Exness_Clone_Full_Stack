import type { Request, Response } from "express";
import ApiResponse from "../lib/ApiResponse.js";
import prisma from "db/client"

export async function getCandles(req:Request,res:Response){
    console.log('inside getCandles');
    let model;
    try {
        const {symbol,duration,startTime,endTime}=req.query;

        if(!symbol || !duration || !startTime || !endTime){
            return res.status(400).json(
                new ApiResponse(false,"Invalid search queries provided")
            )
        }
        if(duration=='1m')model=prisma.candles_1m;
        else if(duration=='5m')model=prisma.candles_5m;
        else if(duration=='1h')model=prisma.candles_1h;
        else {
            return res.status(400).json(
                new ApiResponse(false,"Incalid duration specified")
            )
        }

        const candles=await model.findMany({
            where:{
                symbol,
                bucket:{
                    gte:startTime,
                    lte:endTime
                }
            },
            orderBy:{
                bucket:'asc'
            }
        });

        console.log('candles : ',candles);

        return res.status(200).json(
            new ApiResponse(true,"Candles retrived successfullly",candles)
        )
        
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(false,"Failed to retrive candles")
        )
    }
}