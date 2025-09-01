import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { openOrder } from "../controllers/order.controller.js";
const orderRouter = Router()

//start a new order
orderRouter.route("/open")
    .post(authMiddleware,openOrder)

export default orderRouter;
