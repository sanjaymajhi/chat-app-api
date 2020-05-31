const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Post = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "Chat_User" },
  postText: { type: String, default: null, max: 400 },
  postImg: [{ type: String }],
  postImgId: [{ type: String }],
  embedLink: { type: String, default: null },
  postVideo: { type: String, default: null },
  postVideoId: { type: String, default: null },
  likes: [{ type: Schema.Types.ObjectId, ref: "Chat_User" }],
  shares: [{ type: Schema.Types.ObjectId, ref: "Chat_User" }],
  comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Post", Post);
