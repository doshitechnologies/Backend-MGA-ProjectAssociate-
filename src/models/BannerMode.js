// src/models/Banner.model.js
const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    image: {
      url: { type: String, default: null },
      key: { type: String, default: null }, // S3 key for deletion
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Index for sorted display
bannerSchema.index({ displayOrder: 1 });

module.exports = mongoose.model("Banner", bannerSchema);
