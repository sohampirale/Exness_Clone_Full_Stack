import type { Response } from "express";
import type { ExpressRequest } from "../interfaces/index.js";
import jwt from "jsonwebtoken"

export default async function getWSToken(req:ExpressRequest,res:Response){
  try {
    const payload = req.user;
    const WSToken=jwt.sign(payload,process.env.WS_ACCESS_TOKEN_SECRET!)
    res.status(200).json({
      WSToken
    })
  } catch (error) {
    res.status(500).json({
      message:`Failed to sign WSToken`
    })
  }
}