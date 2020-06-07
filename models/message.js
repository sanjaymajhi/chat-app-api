const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Chat = new Schema({
  senderId: { type: Schema.Types.ObjectId, ref: "Chat_User" },
  sent_time: { type: Date, default: Date.now },
  video: { type: String, default: null },
  text: { type: String, default: null },
  gif: { type: String, default: null },
  image: { type: String, default: null },
});

const Message = new Schema({
  user1: { type: Schema.Types.ObjectId, ref: "Chat_User" },
  user2: { type: Schema.Types.ObjectId, ref: "Chat_User" },
  chat: [Chat],
});

module.exports = mongoose.model("Messages", Message);
