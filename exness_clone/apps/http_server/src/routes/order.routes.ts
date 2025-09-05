import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { closeLeverageOrder, closeOrder, openLeverageOrder, openOrder } from "../controllers/order.controller.js";
const orderRouter = Router()

//start a new order
orderRouter.route("/open")
    .post(authMiddleware,openOrder)

orderRouter.route('/close')
    .post(authMiddleware,closeOrder)


orderRouter.route('/leverage/open')
    .post(authMiddleware,openLeverageOrder)

orderRouter.route('/leverage/close')
    .post(authMiddleware,closeLeverageOrder)

export default orderRouter;

