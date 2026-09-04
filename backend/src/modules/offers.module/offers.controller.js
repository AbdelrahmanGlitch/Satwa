import { Router } from "express";
import { validation } from "../../middleware/validation.js";
import { authentication, authorization, roles } from "../../middleware/authrization.js";
import * as OV from "./offers.validation.js";
import * as OS from "./offers.service.js";

const offerRouter = Router();

offerRouter.get("/",authentication,authorization([roles.admin]),OS.listOffers)
offerRouter.post("/",authentication,authorization([roles.admin]),validation(OV.createOfferSchema),OS.createOffer)
offerRouter.delete("/:id",authentication,authorization([roles.admin]),validation(OV.offerIdSchema),OS.deleteOffer)

export default offerRouter;
