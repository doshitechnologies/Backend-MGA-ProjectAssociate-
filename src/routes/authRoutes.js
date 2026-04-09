// src/routes/authRoutes.js
const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  updateProfile,
  changePassword,
} = require("../controllers/authController");
const { authenticateMiddleware } = require("../middleware/auth");

// ─── AUTH (public) ────────────────────────────────────────────────────────────
router.post("/signup", signup);
router.post("/login", login);

// ─── ADMIN PROFILE (protected) ────────────────────────────────────────────────
router.put("/profile", authenticateMiddleware, updateProfile);
router.put("/change-password", authenticateMiddleware, changePassword);

// ─── FILE UPLOADS (protected) ─────────────────────────────────────────────────
// router.post(
//   "/upload",
//   authenticateMiddleware,
//   upload.single("file"),
//   uploadFiles,
// );
// router.post(
//   "/uploadarchitecture",
//   authenticateMiddleware,
//   uploads.single("file"),
//   uploadArchitecture,
// );

// ─── FILE DELETES (protected) ─────────────────────────────────────────────────
// router.delete("/file/:s3Url", authenticateMiddleware, deleteFile);
// router.delete(
//   "/filearchitecture/:s3Url",
//   authenticateMiddleware,
//   deleteArchitectureFile,
// );

module.exports = router;
