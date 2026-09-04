import { asyncHandler } from "../../utils/errorHandling.js";
import offerModel from "../../DB/models/offers.model.js";
import productModel from "../../DB/models/product.model.js";

// Applying an offer is what actually makes a product show up as "on sale"
// on the storefront — the storefront itself just reads Product.price /
// Product.compareAtPrice directly (see products.service.js), it has no
// idea Offer exists.
export const createOffer = asyncHandler(async (req,res,next)=>{
    const {newPrice, productId, categoryId, startDate, endDate} = req.body;
    const product = await productModel.findById(productId);
    if(!product){
        return next(new Error("Product not found", {cause: 404}))
    }
    if(newPrice >= product.price){
        return next(new Error("Offer price must be lower than the current price", {cause: 400}))
    }

    const offer = await offerModel.create({
        newPrice, productId, categoryId, startDate, endDate,
        originalPrice: product.price
    });

    product.compareAtPrice = product.price;
    product.price = newPrice;
    await product.save();

    return res.status(201).json({message: "Offer created and applied", offer})
})

export const listOffers = asyncHandler(async (req,res,next)=>{
    const offers = await offerModel.find().populate("productId").populate("categoryId").sort({createdAt: -1});
    return res.status(200).json({message: "offers", offers})
})

export const deleteOffer = asyncHandler(async (req,res,next)=>{
    const offer = await offerModel.findByIdAndDelete(req.params.id);
    if(!offer){
        return next(new Error("Offer not found", {cause: 404}))
    }
    await productModel.findByIdAndUpdate(offer.productId, {
        price: offer.originalPrice,
        $unset: { compareAtPrice: 1 }
    });
    return res.status(200).json({message: "Offer removed and product price restored"})
})
