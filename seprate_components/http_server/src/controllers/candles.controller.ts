import type { Request, Response } from "express";
import ApiResponse from "../lib/ApiResponse.js";

//symbol,duration,startTime,endTime

export async function getCandles(req:Request,res:Response){
    try {
        const {asset,duration,startTime,endTime}=req.query;
        if(!asset || !duration || !startTime || !endTime){
            return res.status(400).json(
                new ApiResponse(false,"Invalid search queries provided")
            )
        }
        try {
            const candles=await prisma.queryWarUnsafe(``)
        } catch (error) {
            
        }
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(false,"Failed to retrive candles")
        )
    }
}