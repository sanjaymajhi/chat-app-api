const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Comment = new Schema({
  postText: { type: String },
  postGif: { type: String },
  likes: { type: Number, default: 0 },
});

module.exports = mongoose.model("Comment", Comment);
