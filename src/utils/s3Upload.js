// utils/s3Upload.js
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/s3");
const { randomUUID } = require("crypto"); // ← use Node's built-in instead of uuid
const path = require("path");

const uploadToS3 = async (file, folder = "categories") => {
  const ext = path.extname(file.originalname);
  const key = `${folder}/${randomUUID()}${ext}`; // ← randomUUID() instead of uuidv4()

  console.log("BUCKET:", process.env.AWS_BUCKET_NAME); // temp debug

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);

  const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  return { url, key };
};

const deleteFromS3 = async (key) => {
  if (!key) return;

  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });

  await s3.send(command);
};

module.exports = { uploadToS3, deleteFromS3 };
