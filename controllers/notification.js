var async = require("async");
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var validator = require("express-validator");

var User = require("../models/user");
var Notification = require("../models/notification");

exports.get_notifications = (req, res) => {
  const skip = Number(req.params.skip);
  User.findById(req.user_detail.id)
    .select("notifications")
    .populate({
      path: "notifications",
      populate: {
        path: "userWhoPushed",
        select: "imageUri username f_name l_name",
      },
    })
    .exec((err, result) => {
      if (err) {
        throw err;
      }
      if (result) {
        res.json({
          saved: "success",
          notifics: result.notifications.slice(skip),
        });
      }
    });
};
exports.set_notifications = async (req, res, type, userToPushed) => {
  if (req.user_detail.id != userToPushed._id) {
    var notific = {
      type: type,
      userWhoPushed: req.user_detail.id,
    };
    type !== "follow" ? (notific.postId = req.body.postId) : "";
    ["likeComment", "replyComment", "likeReply"].indexOf(type) > -1
      ? (notific.postId = req.postId)
      : "";
    var notification = new Notification(notific);
    await notification.save(async (err) => {
      if (err) {
        throw err;
      }
      userToPushed.notifications.push(notification._id);
      await User.findByIdAndUpdate(
        userToPushed._id,
        userToPushed,
        {},
        (err) => {
          if (err) {
            throw err;
          }
        }
      );
    });
  }
};
