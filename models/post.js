const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Post = new Schema({
  postText: { type: String, required: true, max: 400 },
  postImg: { type: String },
  postImgId: { type: String },
  postGif: { type: String },
  likes: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  date: { type: Date, default: Date.now() },
});

module.exports = mongoose.model("Post", Post);
