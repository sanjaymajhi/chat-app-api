var multer = require("multer");
var cloudinary = require("cloudinary");
var cloudinaryStorage = require("multer-storage-cloudinary");
var dotenv = require("dotenv");
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});
const storage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "chat-app-images",
  allowedFormats: ["jpg", "png"],
  transformation: [{ width: 700, height: 700, crop: "limit" }],
});
module.exports.parser = multer({ storage: storage });
