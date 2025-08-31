import express,{Router} from "express";
import { userSignin, userSignup } from "../controllers/user.controller.js";
const userRouter = Router();

/**
 * 1.User signup 
 * 2.User login
 * 3.retrive charts
 * 4.Get my orders
 * 5.Buy order
 * 6.sell order
 * 7.Get my balance
 */


userRouter.route("/signup")
    .post(userSignup)

userRouter.route("/signin")
    .post(userSignin)


userRouter.route("/candles")
    .get()