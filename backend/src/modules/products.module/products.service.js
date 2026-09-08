import { asyncHandler } from "../../utils/errorHandling.js";
import productModel from "../../DB/models/product.model.js";
import categoryModel from "../../DB/models/category.model.js";
import cloudinary from "../../utils/cloudenary/index.js";
import { slugify } from "../../utils/slugify.js";

// ----------------- product formater --------------------

const formatProduct = (productInfo) => {
    const product = productInfo.toObject ? productInfo.toObject({ virtuals: true }) : productInfo;
    return {
        id: String(product._id),
        slug: product.slug,
        name: product.name,
        tagline: product.tagline,
        gender: product.gender,
        collections: (product.collections || []).map((collections) => (collections && collections.slug ? collections.slug : collections)),
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        images: (product.images || []).map((image) => ({ url: image.secure_url, publicId: image.public_id })),
        notes: product.notes,
        description: product.description,
        bestSeller: product.bestSeller,
        isNew: product.newArrival,
        inStock: product.inStock,
        stockQuantity: product.stockQuantity,
        volumeMl: product.volumeMl,
        createdAt: product.createdAt
    };
};

// --------------- get collection Id by slug --------------------

const getCollectionId = async (gender, slugs) => {
    const categories = await categoryModel.find({ gender, slug: { $in: slugs } });
    const found = new Set(categories.map((c) => c.slug));
    const missing = slugs.filter((s) => !found.has(s));
        if (missing.length) {
            throw new Error(`Collection Not Found: ${missing.join(", ")}`, {cause: 404})
        }
    return categories.map((c) => c._id);
 };

// ----------------------------- createProduct -----------------------------

export const createProduct = asyncHandler(async (req, res, next) => {
    const { name, tagline, description, price, compareAtPrice, gender, collections, notes, volumeMl, stockQuantity, bestSeller, isNew } = req.body;

    const collectionIds = await getCollectionId(gender, collections);

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

    const createdProduct = await productModel.findById(product._id).populate("collections", "slug");
    return res.status(201).json({ message: "Product created successfully", product: formatProduct(createdProduct) });
});

// ----------------------------- getProducts -----------------------------

export const getProducts = asyncHandler(async (req, res, next) => {
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

    const products = await productModel.find(filter).populate("collections", "slug").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
    const total = await productModel.countDocuments(filter)

    return res.status(200).json({
        message: "products",
        products: products.map(formatProduct),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
});

// ----------------------------- getProductBySlug -----------------------------

export const getProductBySlug = asyncHandler(async (req, res, next) => {
    const product = await productModel.findOne({ slug: req.params.slug }).populate("collections", "slug");
    if (!product) {
        return next(new Error("Product not found", { cause: 404 }));
    }
    return res.status(200).json({ message: "product", product: formatProduct(product) });
});

// ----------------------------- getProductById -----------------------------

export const getProductById = asyncHandler(async (req, res, next) => {
    const product = await productModel.findById(req.params.id).populate("collections", "slug");
    if (!product) {
        return next(new Error("Product not found", { cause: 404 }));
    }
    return res.status(200).json({ message: "product", product: formatProduct(product) });
});

// ----------------------------- getProductsByIds -----------------------------

export const getProductsByIds = asyncHandler(async (req, res, next) => {
    const { ids } = req.body;
    const products = await productModel.find({ _id: { $in: ids } }).populate("collections", "slug");
    return res.status(200).json({ message: "products", products: products.map(formatProduct) });
});

// ----------------------------- updateProduct -----------------------------

export const updateProduct = asyncHandler(async (req, res, next) => {
    const product = await productModel.findById(req.params.id);
    if (!product) {
        return next(new Error("Product not found", { cause: 404 }));
    }

    const { name, tagline, description, price, compareAtPrice, gender, collections, notes, volumeMl, stockQuantity, bestSeller, isNew, removeImages } = req.body;

    if (name) {
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

    const newGender = gender || product.gender;
    if (collections) {
        product.collections = await getCollectionId(newGender, collections);
    }
    if (gender) product.gender = gender;

    if (removeImages?.length) {
        const toRemove = product.images.filter((Image) => removeImages.includes(Image.public_id));
        for (const img of toRemove) {
            await cloudinary.uploader.destroy(img.public_id);
        }
        product.images = product.images.filter((Image) => !removeImages.includes(Image.public_id));
    }

    if (req.files?.length) {
        for (const file of req.files) {
            const { secure_url, public_id } = await cloudinary.uploader.upload(file.path, { folder: "Satwa/products" });
            product.images.push({ secure_url, public_id });
        }
    }

    await product.save();
    const updatedProject = await productModel.findById(product._id).populate("collections", "slug");
    return res.status(200).json({ message: "Product updated", product: formatProduct(updatedProject) });
});

// ----------------------------- deleteProduct -----------------------------

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
