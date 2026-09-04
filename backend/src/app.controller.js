import cors from 'cors';
import connectionDB from "./DB/connectionDB.js";
import { globalErrorHandling } from "./utils/errorHandling.js";
import userRouter from './modules/user.module/user.controller.js';
import adminRouter from './modules/admin.module/admin.controller.js';
import categoryRouter from './modules/category.model/category.controller.js';
import productRouter from './modules/products.module/products.controller.js';
import offerRouter from './modules/offers.module/offers.controller.js';
import orderRouter from './modules/order.module/order.controller.js';
import paymentRouter from './modules/payment.module/payment.controller.js';

const bootstrap = async (app,express) => {
    app.use(cors());
    app.use(express.json());
    app.get("/", (req,res,next)=>{
        return res.status(200).json({msg: "Hello to saraha project"})
    })
    await connectionDB()
    app.use("/users", userRouter)
    app.use("/admin", adminRouter)
    app.use("/product", productRouter)
    app.use("/category", categoryRouter)
    app.use("/offer", offerRouter)
    app.use("/order", orderRouter)
    app.use("/payment", paymentRouter)
    app.use(globalErrorHandling)
}

export default bootstrap;
