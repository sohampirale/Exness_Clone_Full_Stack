import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { closeOrder, openOrder } from "../controllers/order.controller.js";
const orderRouter = Router()

//start a new order
orderRouter.route("/open")
    .post(authMiddleware,openOrder)

orderRouter.route('/close')
    .post(authMiddleware,closeOrder)

export default orderRouter;
