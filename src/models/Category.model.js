// models/Category.js  — update categoryImage to also store the S3 key
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    categoryImage: {
      url: { type: String, default: null },
      key: { type: String, default: null }, // S3 object key for deletion
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

categorySchema.pre("validate", function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
  }
  next();
});

categorySchema.index({ slug: 1 });

module.exports = mongoose.model("Category", categorySchema);
