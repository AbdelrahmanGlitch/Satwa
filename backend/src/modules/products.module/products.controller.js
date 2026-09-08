import { Router } from "express";
import { authentication, authorization, roles } from "../../middleware/authrization.js";
import { validation } from "../../middleware/validation.js";
import { multerCloudinary } from "../../middleware/multer.js";
import { parseJsonFields } from "../../middleware/parseJsonFields.js";
import * as PV from "./products.validation.js";
import * as PS from "./products.service.js";

const productRouter = Router();

productRouter.get("/",validation(PV.listProductsSchema),PS.getProducts)
productRouter.post("/by-ids",validation(PV.getProductsByIdsSchema),PS.getProductsByIds)
productRouter.get("/id/:id",validation(PV.getProductByIdSchema),PS.getProductById)
productRouter.get("/:slug",validation(PV.getProductBySlugSchema),PS.getProductBySlug)

productRouter.post(
    "/create",
    authentication,
    authorization([roles.admin]),
    multerCloudinary().array("images", 6),
    parseJsonFields(["collections","notes","bestSeller","isNew"]),
    validation(PV.createProductSchema),
    PS.createProduct
)
productRouter.patch(
    "/:id",
    authentication,
    authorization([roles.admin]),
    multerCloudinary().array("images", 6),
    parseJsonFields(["collections","notes","removeImages","bestSeller","isNew"]),
    validation(PV.updateProductSchema),
    PS.updateProduct
)
productRouter.delete(
    "/:id",
    authentication,
    authorization([roles.admin]),
    validation(PV.productIdSchema),
    PS.deleteProduct
)

export default productRouter;
