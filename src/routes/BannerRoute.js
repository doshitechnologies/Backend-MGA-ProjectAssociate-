// src/routes/bannerRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  toggleBannerStatus,
  deleteBanner,
} = require("../controllers/BannerController");
const { authenticateMiddleware } = require("../middleware/auth");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const valid =
      allowed.test(file.mimetype) &&
      allowed.test(
        path.extname(file.originalname).toLowerCase().replace(".", ""),
      );
    valid
      ? cb(null, true)
      : cb(new Error("Only images allowed: jpeg, jpg, png, webp"));
  },
});

// ─── PUBLIC ───────────────────────────────────────────────────────────────────
router.get("/", getAllBanners);
router.get("/:id", getBannerById);

// ─── PROTECTED ────────────────────────────────────────────────────────────────
router.post("/", authenticateMiddleware, upload.single("image"), createBanner);
router.put(
  "/:id",
  authenticateMiddleware,
  upload.single("image"),
  updateBanner,
);
router.patch("/:id/toggle", authenticateMiddleware, toggleBannerStatus);
router.delete("/:id", authenticateMiddleware, deleteBanner);

module.exports = router;
