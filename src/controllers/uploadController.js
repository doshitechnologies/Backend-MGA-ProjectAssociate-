const AWS = require("aws-sdk");
const multer = require("multer");

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Configure Multer for file uploads (in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// File Upload Controller
const uploadFiles = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    const file = req.file;

    // Prepare S3 upload parameters
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: file.originalname,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    // Upload file to S3
    const result = await s3.upload(params).promise();

    return res.status(201).json({
      message: "File uploaded successfully",
      fileUrl: result.Location,
    });
  } catch (e) {
    console.error("Upload Error:", e);
    return res.status(500).json({ message: "File upload failed", error: e.message });
  }
};

const extractFileKey = (s3Url) => {
  try {
    const url = new URL(s3Url);
    return url.pathname.substring(1);
  } catch (error) {
    console.error("Invalid URL:", error.message);
    return null;
  }
};

const extractBucketName = (s3Url) => {
  try {
    const url = new URL(s3Url);
    const hostParts = url.hostname.split('.');

    if (hostParts.length > 3 && hostParts[1] === 's3') {
      return hostParts[0];
    }


    const pathParts = url.pathname.split('/');
    if (pathParts.length > 1) {
      return pathParts[1];
    }

    return null;
  } catch (error) {
    console.error("Invalid URL:", error.message);
    return null;
  }
};

const deleteFileUsings3URL = async (s3Url) => {
  try {
    let fileKey = decodeURIComponent(extractFileKey(s3Url));
    const bucketName = decodeURIComponent(extractBucketName(s3Url));

    if (!fileKey) {
      throw new Error("Invalid S3 URL");
    }

    const params = {
      Bucket: bucketName,
      Key: fileKey
    };
    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error(`Error deleting file: ${error.message}`);
    throw new Error(error.message);
  }
};

const deleteFile = async (req, res) => {
  try {
    const { s3Url } = req.params;
    await deleteFileUsings3URL(s3Url);
    res.status(200).json({
      success: true,
      message: 'Delete successful'
    });
  } catch (error) {
    console.error(`Error deleting file: ${error.message}`);
    res.status(500).json({ success: false, error: 'Delete failed', details: error.message });
  }
};

const deleteArchitectureFile = async (req, res) => {
  try {
    const { s3Url } = req.params;
    await deleteFileUsings3URL(s3Url);
    res.status(200).json({
      success: true,
      message: 'Delete successful'
    });
  } catch (error) {
    console.error(`Error deleting file: ${error.message}`);
    res.status(500).json({ success: false, error: 'Delete failed', details: error.message });
  }
};

module.exports = { deleteFile, uploadFiles, deleteFileUsings3URL, deleteArchitectureFile, upload };