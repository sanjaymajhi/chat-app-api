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
  imageUri: { type: String, default: "" },
  username: { type: String, min: 1, max: 15, default: "" },
  location: { type: String, min: 1, max: 40, default: "" },
  bio: { type: String, min: 10, max: 200, default: "" },
  followers: [{ type: Schema.Types.ObjectId, ref: "Chat_User" }],
  following: [{ type: Schema.Types.ObjectId, ref: "Chat_User" }],
  join_date: { type: Date, default: Date.now() },
  coverImageUri: { type: String, default: "" },
  imageUriId: { type: String, default: "" },
  coverImageUriId: { type: String, default: "" },
});

module.exports = mongoose.model("Chat_User", User);
