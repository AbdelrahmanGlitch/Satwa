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

const bootstrap = (app, express) => {
    app.use(cors());
    app.use(express.json());

    app.get("/", (req, res, next) => {
        return res.status(200).json({ msg: "Hello to saraha project" })
    })

    // Every router below is registered synchronously, in the same tick as
    // the app itself — deliberately not gated behind the DB connecting
    // first. Mongoose already queues queries until the connection is
    // ready (bufferCommands), so nothing needs the connection to exist
    // before routes are wired up. On a long-running local server this
    // "await connectionDB() first" ordering was harmless (the connection
    // finishes long before the first real request arrives), but on a
    // serverless platform (Vercel) it's fatal: each invocation's
    // execution can be killed by the platform's timeout while still
    // waiting on that await, and every route registered after it —
    // which, before this fix, was every route except "/" — never gets
    // set up at all. That exact symptom (only "/" responding, everything
    // else 404ing) is what this fixes.
    app.use("/users", userRouter)
    app.use("/admin", adminRouter)
    app.use("/product", productRouter)
    app.use("/category", categoryRouter)
    app.use("/offer", offerRouter)
    app.use("/order", orderRouter)
    app.use("/payment", paymentRouter)

    app.use(globalErrorHandling)

    // Connects in the background. Returned (not awaited internally) so a
    // long-running caller can still await/log it if it wants to, without
    // route registration above ever depending on it.
    return connectionDB();
}

export default bootstrap;
