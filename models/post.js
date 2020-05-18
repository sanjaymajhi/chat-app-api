const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Post = new Schema({
  postText: { type: String, required: true, max: 400 },
  postImg: { type: String },
  postImgId: { type: String },
  postGif: { type: String },
  likes: [{ type: Schema.Types.ObjectId, ref: "Chat_User" }],
  shares: [{ type: Schema.Types.ObjectId, ref: "Chat_User" }],
  comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Post", Post);
