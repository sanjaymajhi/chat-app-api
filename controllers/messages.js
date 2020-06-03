const async = require("async");
var validator = require("express-validator");

const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");
const Message = require("../models/message");

exports.friend_list = (req, res) => {
  User.findById(req.user_detail.id)
    .populate("following")
    .exec((err, result) => {
      if (err) {
        throw err;
      }
      if (result) {
        const data = [];
        result.following.map((item) => {
          data.push({
            id: item._id,
            name: item.f_name + " " + item.l_name,
            username: item.username.split("@")[1],
            imageUri: item.imageUri,
            isOnline:
              new Date() - new Date(item.last_login) < 3600000
                ? item.isLoggedIn === true
                : false,
          });
        });

        res.json({ saved: "success", data: data });
      }
    });
};

exports.getMessageBoxId = (req, res) => {
  const idList = [req.user_detail.id, req.body.friend_id];
  Message.findOne({ user1: { $in: idList }, user2: { $in: idList } }).exec(
    (err, result) => {
      if (err) {
        throw err;
      }
      if (result) {
        res.json({ saved: "success", msgBoxId: result._id });
      } else {
        var msgBox = new Message({
          user1: req.user_detail.id,
          user2: req.body.friend_id,
        });
        msgBox.save((err) => {
          if (err) {
            throw err;
          }
          res.json({ saved: "success", msgBoxId: msgBox._id });
        });
      }
    }
  );
};

exports.getMessages = (req, res) => {
  const msgBoxId = req.params.id;
  Message.findById(msgBoxId)
    .populate({ path: "user1", select: "f_name l_name username imageUri" })
    .populate({ path: "user2", select: "f_name l_name username imageUri" })
    .exec((err, result) => {
      if (err) {
        throw err;
      }
      if (result) {
        res.json({
          saved: "success",
          msgs: result.chat,
          user1: result.user1,
          user2: result.user2,
          id: result._id,
        });
      } else {
        res.json({ saved: "unsuccessful", error: { msg: "no messages" } });
      }
    });
};

exports.getNewMessages = (req, res) => {
  const msgBoxId = req.params.id;
  const leave = Number(req.params.leave);
  Message.findOne({ _id: msgBoxId })
    .select({ chat: { $slice: [leave, $chat.length - leave] } })
    .exec((err, result) => {
      if (err) {
        throw err;
      }
      if (result) {
        console.log(result.chat.length);
        res.json({
          saved: "success",
          msgs: result.chat,
        });
      }
    });
};

exports.sendMessage = [
  validator.body("text").escape(),
  (req, res) => {
    var newMsg = { senderId: req.user_detail.id };
    if (req.body.text !== "" && req.body.text !== undefined) {
      newMsg.text = req.body.text;
    } else if (req.body.gif !== "" && req.body.gif !== undefined) {
      newMsg.gif = req.body.gif;
    } else {
      newMsg.image = req.file.url;
    }
    console.log(newMsg);
    Message.findById(req.body.msgBoxId).exec((err, result) => {
      if (err) {
        throw err;
      }
      if (result) {
        result.chat.push(newMsg);
        var msg = new Message({
          _id: result._id,
          user1: result.user1,
          user2: result.user2,
          chat: result.chat,
        });

        Message.findByIdAndUpdate(msg._id, msg, {}, (err) => {
          if (err) {
            throw err;
          }
          res.json({ saved: "success" });
        });
      }
    });
  },
];
