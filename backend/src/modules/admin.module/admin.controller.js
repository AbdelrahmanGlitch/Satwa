import { Router } from "express";
import * as AS from './admin.service.js';
import { validation } from "../../middleware/validation.js";
import * as AV from './admin.validation.js';

const adminRouter = Router();

adminRouter.post("/createAdmin65321sA351A35sdfDK6d46fH6",validation(AV.createAdminSchema), AS.createAdmin)
adminRouter.post("/login",validation(AV.loginSchema), AS.login)

export default adminRouter;