import { asyncHandler } from "../../utils/errorHandling.js";
import productModel from "../../DB/models/product.model.js";
import categoryModel from "../../DB/models/category.model.js";
import cloudinary from "../../utils/cloudenary/index.js";
import { slugify } from "../../utils/slugify.js";

// Shapes a product document (with `collections` populated) into exactly
// the fields the frontend's `Product` type expects — `id` instead of
// `_id`, `collections` as slugs — so the frontend never has to know about
// Mongo's document shape. `images` keeps both `url` (what gets rendered)
// and `publicId` (what the admin edit form needs to send back in
// `removeImages` to delete a specific one from Cloudinary).
const formatProduct = (doc) => {
    const obj = doc.toObject ? doc.toObject({ virtuals: true }) : doc;
    return {
        id: String(obj._id),
        slug: obj.slug,
        name: obj.name,
        tagline: obj.tagline,
        gender: obj.gender,
        collections: (obj.collections || []).map((c) => (c && c.slug ? c.slug : c)),
        price: obj.price,
        compareAtPrice: obj.compareAtPrice,
        images: (obj.images || []).map((i) => ({ url: i.secure_url, publicId: i.public_id })),
        notes: obj.notes,
        description: obj.description,
        bestSeller: obj.bestSeller,
        isNew: obj.newArrival,
        inStock: obj.inStock,
        stockQuantity: obj.stockQuantity,
        volumeMl: obj.volumeMl
    };
};

/** Resolves a list of collection slugs + a gender into Category ObjectIds, erroring on anything that doesn't exist. */
const resolveCollectionIds = async (gender, slugs) => {
    const categories = await categoryModel.find({ gender, slug: { $in: slugs } });
    const found = new Set(categories.map((c) => c.slug));
    const missing = slugs.filter((s) => !found.has(s));
    if (missing.length) {
        const err = new Error(`Unknown collection(s) for ${gender}: ${missing.join(", ")}`);
        err.cause = 400;
        throw err;
    }
    return categories.map((c) => c._id);
};

export const createProduct = asyncHandler(async (req, res, next) => {
    const { name, tagline, description, price, compareAtPrice, gender, collections, notes, volumeMl, stockQuantity, bestSeller, isNew } = req.body;

    const collectionIds = await resolveCollectionIds(gender, collections);

    let slug = slugify(name);
    if (await productModel.findOne({ slug })) {
        slug = `${slug}-${Date.now().toString(36)}`;
    }

    const images = [];
    if (req.files?.length) {
        for (const file of req.files) {
            const { secure_url, public_id } = await cloudinary.uploader.upload(file.path, { folder: "Satwa/products" });
            images.push({ secure_url, public_id });
        }
    }

    const product = await productModel.create({
        name,
        slug,
        tagline,
        description,
        price,
        compareAtPrice,
        gender,
        collections: collectionIds,
        notes,
        volumeMl,
        stockQuantity,
        bestSeller,
        newArrival: isNew,
        images,
        createdBy: req.user?._id
    });

    const populated = await productModel.findById(product._id).populate("collections", "slug");
    return res.status(201).json({ message: "Product created successfully", product: formatProduct(populated) });
});

export const listProducts = asyncHandler(async (req, res, next) => {
    const { gender, collection, bestSeller, isNew, onSale, search } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 24);

    const filter = {};
    if (gender) filter.gender = gender;
    if (bestSeller === "true") filter.bestSeller = true;
    if (isNew === "true") filter.newArrival = true;
    if (onSale === "true") filter.compareAtPrice = { $exists: true, $gt: 0 };
    if (search) filter.name = { $regex: search, $options: "i" };

    if (collection) {
        const categories = await categoryModel.find({ slug: collection, ...(gender ? { gender } : {}) });
        filter.collections = { $in: categories.map((c) => c._id) };
    }

    const [products, total] = await Promise.all([
        productModel.find(filter).populate("collections", "slug").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
        productModel.countDocuments(filter)
    ]);

    return res.status(200).json({
        message: "products",
        products: products.map(formatProduct),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
});

export const getProductBySlug = asyncHandler(async (req, res, next) => {
    const product = await productModel.findOne({ slug: req.params.slug }).populate("collections", "slug");
    if (!product) {
        return next(new Error("Product not found", { cause: 404 }));
    }
    return res.status(200).json({ message: "product", product: formatProduct(product) });
});

// Cart/wishlist store products by Mongo id client-side (not slug), so
// they need an id-based lookup — a single one here, a batch one below for
// resolving a whole cart/wishlist in one request instead of N.
export const getProductById = asyncHandler(async (req, res, next) => {
    const product = await productModel.findById(req.params.id).populate("collections", "slug");
    if (!product) {
        return next(new Error("Product not found", { cause: 404 }));
    }
    return res.status(200).json({ message: "product", product: formatProduct(product) });
});

export const getProductsByIds = asyncHandler(async (req, res, next) => {
    const { ids } = req.body;
    const products = await productModel.find({ _id: { $in: ids } }).populate("collections", "slug");
    return res.status(200).json({ message: "products", products: products.map(formatProduct) });
});

export const updateProduct = asyncHandler(async (req, res, next) => {
    const product = await productModel.findById(req.params.id);
    if (!product) {
        return next(new Error("Product not found", { cause: 404 }));
    }

    const { name, tagline, description, price, compareAtPrice, gender, collections, notes, volumeMl, stockQuantity, bestSeller, isNew, removeImages } = req.body;

    if (name) {
        // Only re-slugify when the name actually changed — same fix as
        // categories. Re-slugifying on every edit (even an unchanged name)
        // would also silently drop the "-<random>" suffix a slug gets at
        // creation time when its plain slugified form collided with an
        // existing product, changing the product's URL and risking a new
        // collision on every subsequent unrelated edit.
        if (name !== product.name) {
            product.slug = slugify(name);
        }
        product.name = name;
    }
    if (tagline !== undefined) product.tagline = tagline;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (compareAtPrice !== undefined) product.compareAtPrice = compareAtPrice;
    if (volumeMl !== undefined) product.volumeMl = volumeMl;
    if (stockQuantity !== undefined) product.stockQuantity = stockQuantity;
    if (bestSeller !== undefined) product.bestSeller = bestSeller;
    if (isNew !== undefined) product.newArrival = isNew;
    if (notes !== undefined) product.notes = notes;

    const effectiveGender = gender || product.gender;
    if (collections) {
        product.collections = await resolveCollectionIds(effectiveGender, collections);
    }
    if (gender) product.gender = gender;

    if (removeImages?.length) {
        const toRemove = product.images.filter((i) => removeImages.includes(i.public_id));
        for (const img of toRemove) {
            await cloudinary.uploader.destroy(img.public_id).catch(() => {});
        }
        product.images = product.images.filter((i) => !removeImages.includes(i.public_id));
    }

    if (req.files?.length) {
        for (const file of req.files) {
            const { secure_url, public_id } = await cloudinary.uploader.upload(file.path, { folder: "Satwa/products" });
            product.images.push({ secure_url, public_id });
        }
    }

    await product.save();
    const populated = await productModel.findById(product._id).populate("collections", "slug");
    return res.status(200).json({ message: "Product updated", product: formatProduct(populated) });
});

export const deleteProduct = asyncHandler(async (req, res, next) => {
    const product = await productModel.findByIdAndDelete(req.params.id);
    if (!product) {
        return next(new Error("Product not found", { cause: 404 }));
    }
    for (const img of product.images) {
        await cloudinary.uploader.destroy(img.public_id).catch(() => {});
    }
    return res.status(200).json({ message: "Product deleted" });
});
