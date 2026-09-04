import { Router } from "express";
import { validation } from "../../middleware/validation.js";
import * as PV from "./payment.validation.js";
import * as PS from "./payment.service.js";

const paymentRouter = Router();

// No auth on purpose — this plays the role of a gateway calling back after
// the fake checkout page, not a user action. The random sessionToken is
// what's standing in for a real gateway's signed webhook.
paymentRouter.post("/fake/confirm",validation(PV.confirmPaymentSchema),PS.confirmFakePayment)

export default paymentRouter;
