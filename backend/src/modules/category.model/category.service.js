import categoryModel from "../../DB/models/category.model.js";
import { asyncHandler } from "../../utils/errorHandling.js";
import { slugify } from "../../utils/slugify.js";
import cloudinary from './../../utils/cloudenary/index.js';

// ----------------------------- createCategory -----------------------------

export const createCategory = asyncHandler(async (req,res,next)=>{
    const {title, description, gender, tagline} = req.body;
    const slug = slugify(title);
    if(await categoryModel.findOne({gender, slug})){
        return next(new Error("A category with this title already exists for this gender", {cause: 409}))
    }

    let coverImage;
    if(req.file){
        const {secure_url, public_id} = await cloudinary.uploader.upload(req.file.path, {
            folder: "Satwa/categories"
        })
        coverImage = {secure_url, public_id};
    }

    const category = await categoryModel.create({
        title,
        slug,
        description,
        gender,
        tagline,
        coverImage,
        createdBy: req.user?._id
    })
    return res.status(201).json({message:"Category created successfully",category})
})

// ----------------------------- getCategories -----------------------------

export const getCategories = asyncHandler(async (req,res,next)=>{
    const filter = {};
    if(req.query.gender) filter.gender = req.query.gender;

    if(req.query.page || req.query.limit){
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Number(req.query.limit) || 24);
        const categories = await categoryModel.find(filter).sort({createdAt: -1}).skip((page - 1) * limit).limit(limit)
        const total = await categoryModel.countDocuments(filter)

        return res.status(200).json({
            message: "categories", categories,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        })
    }

    const categories = await categoryModel.find(filter).sort({createdAt: -1});
    return res.status(200).json({message: "categories", categories})
})

// ----------------------------- getCategoryById -----------------------------

export const getCategoryById = asyncHandler(async (req,res,next)=>{
    const category = await categoryModel.findById(req.params.id);
    if(!category){
        return next(new Error("Category not found", {cause: 404}))
    }
    return res.status(200).json({message: "category", category})
})

// ----------------------------- getCategoryBySlug -----------------------------

export const getCategoryBySlug = asyncHandler(async (req,res,next)=>{
    const {gender, slug} = req.params;
    const category = await categoryModel.findOne({gender, slug});
    if(!category){
        return next(new Error("Category not found", {cause: 404}))
    }
    return res.status(200).json({message: "category", category})
})

// ----------------------------- updateCategory -----------------------------

export const updateCategory = asyncHandler(async (req,res,next)=>{
    const {id} = req.params;
    const category = await categoryModel.findById(id);
    if(!category){
        return next(new Error("Category not found", {cause: 404}))
    }

    const {title, description, gender, tagline} = req.body;
    if(title){
        if(title !== category.title){
            category.slug = slugify(title);
        }
        category.title = title;
    }
    if(description !== undefined) category.description = description;
    if(gender !== undefined) category.gender = gender;
    if(tagline !== undefined) category.tagline = tagline;

    if(req.file){
        if(category.coverImage?.public_id){
            await cloudinary.uploader.destroy(category.coverImage.public_id).catch(()=>{});
        }
        const {secure_url, public_id} = await cloudinary.uploader.upload(req.file.path, {
            folder: "Satwa/categories"
        })
        category.coverImage = {secure_url, public_id};
    }

    await category.save();
    return res.status(200).json({message: "Category updated", category})
})

// ----------------------------- deleteCategory -----------------------------

export const deleteCategory = asyncHandler(async (req,res,next)=>{
    const {id} = req.params;
    const category = await categoryModel.findByIdAndDelete(id);
    if(!category){
        return next(new Error("Category not found", {cause: 404}))
    }
    if(category.coverImage?.public_id){
        await cloudinary.uploader.destroy(category.coverImage.public_id).catch(()=>{});
    }
    return res.status(200).json({message: "Category deleted"})
})
