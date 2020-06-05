const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Sub_Comment = new Schema({
  userId: [{ type: Schema.Types.ObjectId, ref: "Chat_User" }],
  postText: { type: String, default: null, max: 400 },
  postImg: { type: String, default: null },
  postImgId: { type: String, default: null },
  postGif: { type: String, default: null },
  likes: [{ type: Schema.Types.ObjectId, ref: "Chat_User" }],
  date: { type: Date, default: Date.now },
});

const Comment = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "Chat_User" },
  postId: { type: Schema.Types.ObjectId, ref: "Post" },
  postText: { type: String, default: null, max: 400 },
  postImg: [{ type: String, default: null }],
  postImgId: [{ type: String, default: null }],
  postGif: { type: String, default: null },
  likes: [{ type: Schema.Types.ObjectId, ref: "Chat_User" }],
  sub_comments: [Sub_Comment],
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Comment", Comment);
