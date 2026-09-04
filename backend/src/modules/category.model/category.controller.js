import { Router } from "express";
import { validation } from "../../middleware/validation.js";
import { authentication, authorization, roles } from "../../middleware/authrization.js";
import * as CV from './category.validation.js';
import * as CS from "./category.service.js";
import { multerCloudinary } from "../../middleware/multer.js";

const categoryRouter = Router()

categoryRouter.get("/",validation(CV.listCategoriesSchema),CS.listCategories)
// Registered before "/:gender/:slug" — that pattern also matches two path
// segments, so "/id/:id" would otherwise be swallowed by it (with "id"
// mistaken for the gender param).
categoryRouter.get("/id/:id",validation(CV.categoryIdSchema),CS.getCategoryById)
categoryRouter.get("/:gender/:slug",validation(CV.getCategoryBySlugSchema),CS.getCategoryBySlug)

categoryRouter.post(
    "/create",
    authentication,
    authorization([roles.admin]),
    multerCloudinary().single("coverImage"),
    validation(CV.createCategorySchema),
    CS.createCategory
)
categoryRouter.patch(
    "/:id",
    authentication,
    authorization([roles.admin]),
    multerCloudinary().single("coverImage"),
    validation(CV.updateCategorySchema),
    CS.updateCategory
)
categoryRouter.delete(
    "/:id",
    authentication,
    authorization([roles.admin]),
    validation(CV.categoryIdSchema),
    CS.deleteCategory
)

export default categoryRouter;
