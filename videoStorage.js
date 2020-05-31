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

const storageVideo = cloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "chat-app-videos",
    format: "mp4",
    resource_type: "video",
  },
});

module.exports.parserVideo = multer({ storage: storageVideo });
