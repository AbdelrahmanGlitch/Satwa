import { Router } from "express";
import { validation } from "../../middleware/validation.js";
import { authentication, authorization, roles } from "../../middleware/authrization.js";
import * as OV from "./order.validation.js";
import * as OS from "./order.service.js";

const orderRouter = Router();

orderRouter.post("/checkout",authentication,authorization([roles.user]),validation(OV.checkoutSchema),OS.checkout)
orderRouter.get("/mine",authentication,authorization([roles.user]),OS.getMyOrders)
orderRouter.get("/:id",authentication,validation(OV.orderIdSchema),OS.getOrderById)

orderRouter.get("/",authentication,authorization([roles.admin]),validation(OV.listOrdersSchema),OS.listAllOrders)
orderRouter.patch("/:id/status",authentication,authorization([roles.admin]),validation(OV.updateOrderStatusSchema),OS.updateOrderStatus)

export default orderRouter;
