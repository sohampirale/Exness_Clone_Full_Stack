import {Router} from "express"
import authMiddleware from "../middlewares/authMiddleware.js"
import getWSToken from "../controllers/token.controller.js"
const tokenRouter =Router()

tokenRouter.route("/WSToken")
  .get(authMiddleware,getWSToken)

export default tokenRouter