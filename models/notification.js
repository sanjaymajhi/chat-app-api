const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Notification = new Schema({
  type: {
    type: String,
    required: true,
    enum: [
      "share",
      "like",
      "comment",
      "follow",
      "likeComment",
      "replyComment",
      "likeReply",
    ],
  },
  userWhoPushed: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Chat_User",
  },
  postId: {
    type: Schema.Types.ObjectId,
  },
  datetime: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", Notification);
