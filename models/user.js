const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const User = new Schema({
  f_name: { type: String, required: true },
  l_name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: this.method === "native" ? true : false },
  method: {
    type: String,
    required: true,
    enum: ["native", "google", "facebook"],
  },
  imageUri: { type: String, default: null },
  username: { type: String, min: 1, max: 15, default: null },
  location: { type: String, min: 1, max: 40, default: null },
  bio: { type: String, min: 10, max: 200, default: null },
  followers: [{ type: Schema.Types.ObjectId, ref: "Chat_User" }],
  following: [{ type: Schema.Types.ObjectId, ref: "Chat_User" }],
  join_date: { type: Date, default: Date.now() },
  coverImageUri: { type: String, default: null },
  imageUriId: { type: String, default: null },
  coverImageUriId: { type: String, default: null },
  posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
  notifications: [{ type: Schema.Types.ObjectId, ref: "Notification" }],
  last_login: { type: Date, default: Date.now },
  isLoggedIn: { type: Boolean, default: false },
  comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
});

module.exports = mongoose.model("Chat_User", User);
