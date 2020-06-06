const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Sub_Comment = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "Chat_User" },
  replyText: { type: String, default: null, max: 400 },
  replyImg: { type: String, default: null },
  replyImgId: { type: String, default: null },
  replyGif: { type: String, default: null },
  likes: [{ type: Schema.Types.ObjectId, ref: "Chat_User" }],
  date: { type: Date, default: Date.now },
});

const Comment = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: "Chat_User" },
  postId: { type: Schema.Types.ObjectId, ref: "Post" },
  commentText: { type: String, default: null, max: 400 },
  commentImg: [{ type: String, default: null }],
  commentImgId: [{ type: String, default: null }],
  commentGif: { type: String, default: null },
  likes: [{ type: Schema.Types.ObjectId, ref: "Chat_User" }],
  sub_comments: [Sub_Comment],
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Comment", Comment);
