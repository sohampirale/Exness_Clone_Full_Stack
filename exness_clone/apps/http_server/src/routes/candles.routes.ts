import { Router } from "express";
import { getCandles } from "../controllers/candles.controller.js";
const candlesRouter = Router();


candlesRouter.route("/")
    .get(getCandles)


export default candlesRouter;