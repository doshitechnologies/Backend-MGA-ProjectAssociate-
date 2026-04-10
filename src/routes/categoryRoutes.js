// routes/categoryRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
  toggleCategoryStatus,
  deleteCategory,
} = require("../controllers/categoryController");
const { authenticateMiddleware } = require("../middleware/auth");

// ─── MULTER (memory storage — buffer sent directly to S3, no local disk) ──────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const valid =
      allowed.test(file.mimetype) &&
      allowed.test(file.originalname.toLowerCase().split(".").pop());
    valid
      ? cb(null, true)
      : cb(new Error("Only images allowed: jpeg, jpg, png, webp"));
  },
});

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// Public
router.get("/", getAllCategories);
router.get("/slug/:slug", getCategoryBySlug);
router.get("/:id", getCategoryById);

// Protected (add authMiddleware before upload)
router.post(
  "/",
  authenticateMiddleware,
  upload.single("categoryImage"),
  createCategory,
);
router.put(
  "/:id",
  authenticateMiddleware,
  upload.single("categoryImage"),
  updateCategory,
);
router.patch("/:id/toggle", authenticateMiddleware, toggleCategoryStatus);
router.delete("/:id", authenticateMiddleware, deleteCategory);

module.exports = router;
