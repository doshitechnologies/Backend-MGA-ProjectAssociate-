// controllers/categoryController.js
const Category = require("../models/Category.model");
const { uploadToS3, deleteFromS3 } = require("../utils/s3Upload");

// ─── CREATE ───────────────────────────────────────────────────────────────────
exports.createCategory = async (req, res) => {
  try {
    const { name, slug, description, isActive, imageUrl } = req.body;

    // Check duplicate slug
    const existing = await Category.findOne({ slug });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Slug already exists" });
    }

    const categoryData = {
      name,
      slug,
      description,
      isActive: isActive !== undefined ? isActive : true,
    };

    // Priority 1: file upload → push to S3
    if (req.file) {
      const { url, key } = await uploadToS3(req.file, "categories");
      categoryData.categoryImage = { url, key };
    }
    // Priority 2: direct image URL provided (no S3 key needed)
    else if (imageUrl) {
      categoryData.categoryImage = { url: imageUrl, key: null };
    }

    const category = await Category.create(categoryData);

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET ALL ──────────────────────────────────────────────────────────────────
exports.getAllCategories = async (req, res) => {
  try {
    const {
      search = "",
      isActive,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {};

    // 🔍 Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    // ✅ Active filter
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const sortOrder = order === "asc" ? 1 : -1;

    // 🚀 Fetch all categories (no pagination)
    const categories = await Category.find(filter).sort({
      [sortBy]: sortOrder,
    });

    res.status(200).json({
      success: true,
      data: categories,
      total: categories.length, // optional
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ─── GET BY ID ────────────────────────────────────────────────────────────────
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET BY SLUG ──────────────────────────────────────────────────────────────
exports.getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    const { name, slug, description, isActive, imageUrl } = req.body;

    // Slug conflict check
    if (slug && slug !== category.slug) {
      const slugExists = await Category.findOne({
        slug,
        _id: { $ne: req.params.id },
      });
      if (slugExists) {
        return res
          .status(400)
          .json({ success: false, message: "Slug already in use" });
      }
    }

    // New file uploaded → delete old S3 object, upload new one
    if (req.file) {
      if (category.categoryImage?.key) {
        await deleteFromS3(category.categoryImage.key);
      }
      const { url, key } = await uploadToS3(req.file, "categories");
      category.categoryImage = { url, key };
    }
    // Direct URL provided
    else if (imageUrl) {
      // If there was an old S3-managed image, delete it
      if (category.categoryImage?.key) {
        await deleteFromS3(category.categoryImage.key);
      }
      category.categoryImage = { url: imageUrl, key: null };
    }

    if (name !== undefined) category.name = name;
    if (slug !== undefined) category.slug = slug;
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── TOGGLE STATUS ────────────────────────────────────────────────────────────
exports.toggleCategoryStatus = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    category.isActive = !category.isActive;
    await category.save();

    res.status(200).json({
      success: true,
      message: `Category ${category.isActive ? "activated" : "deactivated"} successfully`,
      data: category,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    // Delete image from S3 if it was uploaded there
    if (category.categoryImage?.key) {
      await deleteFromS3(category.categoryImage.key);
    }

    await category.deleteOne();

    res
      .status(200)
      .json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
