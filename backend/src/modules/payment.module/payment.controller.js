import { Router } from "express";
import { validation } from "../../middleware/validation.js";
import * as PV from "./payment.validation.js";
import * as PS from "./payment.service.js";

const paymentRouter = Router();

paymentRouter.post("/fake/confirm",validation(PV.confirmPaymentSchema),PS.confirmFakePayment)

export default paymentRouter;
