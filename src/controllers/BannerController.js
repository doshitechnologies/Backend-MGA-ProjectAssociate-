// src/controllers/bannerController.js
const Banner = require("../models/BannerMode");
const { uploadToS3, deleteFromS3 } = require("../utils/s3Upload");

// ─── CREATE ───────────────────────────────────────────────────────────────────
exports.createBanner = async (req, res) => {
  try {
    const { title, description, imageUrl, isActive, startDate, endDate } =
      req.body;

    if (!title) {
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    }

    const bannerData = {
      title,
      description,
      isActive: isActive !== undefined ? isActive : true,
      startDate: startDate || null,
      endDate: endDate || null,
    };

    if (req.file) {
      const { url, key } = await uploadToS3(req.file, "banners");
      bannerData.image = { url, key };
    } else if (imageUrl) {
      bannerData.image = { url: imageUrl, key: null };
    }

    const banner = await Banner.create(bannerData);

    res.status(201).json({
      success: true,
      message: "Banner created successfully",
      data: banner,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET ALL ──────────────────────────────────────────────────────────────────
exports.getAllBanners = async (req, res) => {
  try {
    const { isActive } = req.query;

    const filter = {};

    // ✅ Active filter
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    // 🚀 Fetch all banners (no pagination)
    const banners = await Banner.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: banners,
      total: banners.length, // optional
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ─── GET BY ID ────────────────────────────────────────────────────────────────
exports.getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }
    res.status(200).json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────
exports.updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    const { title, description, imageUrl, isActive, startDate, endDate } =
      req.body;

    if (req.file) {
      if (banner.image?.key) await deleteFromS3(banner.image.key);
      const { url, key } = await uploadToS3(req.file, "banners");
      banner.image = { url, key };
    } else if (imageUrl) {
      if (banner.image?.key) await deleteFromS3(banner.image.key);
      banner.image = { url: imageUrl, key: null };
    }

    if (title !== undefined) banner.title = title;
    if (description !== undefined) banner.description = description;
    if (isActive !== undefined) banner.isActive = isActive;
    if (startDate !== undefined) banner.startDate = startDate;
    if (endDate !== undefined) banner.endDate = endDate;

    await banner.save();

    res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      data: banner,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── TOGGLE STATUS ────────────────────────────────────────────────────────────
exports.toggleBannerStatus = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.status(200).json({
      success: true,
      message: `Banner ${banner.isActive ? "activated" : "deactivated"} successfully`,
      data: banner,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    if (banner.image?.key) await deleteFromS3(banner.image.key);
    await banner.deleteOne();

    res
      .status(200)
      .json({ success: true, message: "Banner deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
