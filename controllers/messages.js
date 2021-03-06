const async = require("async");
var validator = require("express-validator");

const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");
const Message = require("../models/message");

exports.friend_list = (req, res, next) => {
  User.findById(req.user_detail.id)
    .populate("following")
    .exec((err, result) => {
      if (err) {
        return next(err);
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
              item.isLoggedIn === true
                ? new Date() - new Date(item.last_login) < 3600000
                : false,
          });
        });

        res.json({ saved: "success", data: data });
      }
    });
};

exports.getMessageBoxId = (req, res, next) => {
  const idList = [req.user_detail.id, req.body.friend_id];
  Message.findOne({ user1: { $in: idList }, user2: { $in: idList } }).exec(
    (err, result) => {
      if (err) {
        return next(err);
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

exports.getMessages = (req, res, next) => {
  const msgBoxId = req.params.id;
  Message.findById(msgBoxId)
    .populate({ path: "user1", select: "f_name l_name username imageUri" })
    .populate({ path: "user2", select: "f_name l_name username imageUri" })
    .exec((err, result) => {
      if (err) {
        return next(err);
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

exports.uploadImageForChat = (req, res, next) => {
  res.status(200).json({ saved: "success", link: req.file.url });
};

exports.uploadVideoForChat = (req, res, next) => {
  res.status(200).json({ saved: "success", link: req.file.url });
};
