import { response, type Request, type Response } from "express";
import { users } from "../variables/index.js";
import ApiResponse from "../lib/ApiResponse.js";
import {v4 as uuidv4} from "uuid"

export async function userSignup(req:Request,res:Response){
    try {
        const {username,email,password}=req.body;
        let exists=false;
        for(let i=0;i<users.length;i++){
            if(users[i]?.username==username || users[i]?.email==email){
                exists=true;
                break;
            }
        }
        if(exists){
            return res.status(409).json(new ApiResponse(false,"Username or email already taken"))
        }
        const user={
            userId:uuidv4(),
            username,
            password,
            email,
            balance:{
                usd:{
                    reserved:5000,
                    activeSellOrders:[]
                }
            }
        }

        users.push(user)
        return res.status(201).json(
            new ApiResponse(true,"User signup successfully")
        )
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(true,"Failed to signup the user")
        )
    }
}

export async function userSignin(req:Request,res:Response){
    try {
        const {username,password}=req.body;

        for(let i=0;i<users.length;i++){
            if(users[i]?.username==username){
                if(users[i]?.password==password){
                    return res.status(200).json(
                        new ApiResponse(true,"Login successfull")
                    )
                } else {
                    return response.status(400).json(
                        new ApiResponse(false,"Incorrect password")
                    )
                }
            }
        }
        return res.status(404).json(
            new ApiResponse(false,"User not found with that username")
        )
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(false,"Failed to signin user")
        )
    }
}
