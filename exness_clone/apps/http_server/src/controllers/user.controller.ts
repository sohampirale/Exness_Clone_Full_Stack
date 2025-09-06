import { response, type Request, type Response } from "express";
import { activeUsers, redisQueue, users } from "../variables/index.js";
import ApiResponse from "../lib/ApiResponse.js";
import prisma from "db/client"
import { generateAccessToken } from "../helpers/token.js";

export async function userSignup(req: Request, res: Response) {
    try {
        const { username, email, password } = req.body;

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{
                    email
                }, {
                    username
                }]
            }
        })

        if (existingUser) {
            return res.status(409).json(
                new ApiResponse(false, "User already exists with that username or email")
            )
        }

        const user = await prisma.user.create({
            data: {
                username,
                email,
                password
            }
        })

        const bal={
            usd:{
                reserved:5000
            }
        }

        const userData={
            userData:user,
            bal,
            userId:user.id
        }

        activeUsers[user.id]=userData

        await redisQueue.lPush('newUser',JSON.stringify(userData))

        const accessToken = generateAccessToken({
            id: user.id,
            username,
            email
        });

        return res
            .cookie("accessToken", accessToken, {
                httpOnly: true, // prevents JS access
            })
            .status(201).json(
                new ApiResponse(true, "User signup successfully")
            )
    } catch (error) {
        return res.status(500).json(
            new ApiResponse(true, "Failed to signup the user")
        )
    }
}

export async function userSignin(req: Request, res: Response) {
    try {
        const { identifier, password } = req.body;

         const user = await prisma.user.findFirst({
            where: {
                OR: [{
                    email:identifier
                }, {
                    username:identifier
                }]
            }
        })

        if (!user) {
            return res.status(404).json(
                new ApiResponse(false, "User with gievn username or email does not exists")
            )
        }

        if(user.password!=password){
            return res.status(400).json(
                new ApiResponse(false, "Incorrect password")
            )
        }
        
        const bal={
            usd:{
                reserved:5000
            }
        }

        const userData={
            user,
            bal
        }
        activeUsers[user.id]=userData

        const accessToken=generateAccessToken({
            id:user.id,
            username:user.username,
            email:user.email
        })

        return res
        .cookie("accessToken",accessToken,{
            httpOnly: true, 
        })
        .status(200).json(
            new ApiResponse(true, "Login successfull")
        )
    } catch (error) {
        console.log('ERROR :: userSignin : ',error);
        
        return res.status(500).json(
            new ApiResponse(false, "Failed to signin")
        )
    }
}
