const async = require("async");
var validator = require("express-validator");

const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");
const NotificationController = require("../controllers/notification");

exports.create_post = [
  validator
    .body("text", "you cannot use more than 400 characters")
    .isLength({ max: 400 }),
  async (req, res, next) => {
    console.log(req.file);
    const errors = validator.validationResult(req);
    if (!errors.isEmpty()) {
      res.json({
        saved: "unsuccessful",
        errors: errors.array(),
      });
      return;
    }
    var post_detail = {
      postText: req.body["text"] !== "null" ? req.body["text"] : null,
      embedLink: req.body.embedLink !== "null" ? req.body.embedLink : null,
      postImg: [],
      postImgId: [],
      postVideo: null,
      postVideoId: null,
      user_id: req.user_detail.id,
    };
    console.log(req.body);
    if (req.body["image"] !== "null") {
      req.files.map((file) => {
        post_detail.postImg.push(file.url);
        post_detail.postImgId.push(file.public_id);
      });
    }
    if (req.body["video"] !== "null") {
      post_detail.postVideo = req.file.url;
      post_detail.postVideoId = req.file.public_id;
    }
    var post = new Post(post_detail);
    console.log(post);
    await post.save((err) => {
      if (err) {
        return next(err);
      }
    });
    var postId = post._id;
    await User.findById(req.user_detail.id).exec(async (err, result) => {
      if (err) {
        return next(err);
      }
      result.posts.push(postId);
      var user = new User(result);
      await User.findByIdAndUpdate(user._id, user, {}, (err) => {
        if (err) {
          throw err;
        }
        res.json({ saved: "success" });
      });
    });
  },
];

exports.user_posts = (req, res, next) => {
  User.findOne({ username: "@" + req.params.id }, "posts")
    .populate({
      path: "posts",
      populate: { path: "user_id", select: "f_name l_name username imageUri" },
    })
    .exec((err, result) => {
      if (err) {
        return next(err);
      }
      if (result) {
        res.json({
          saved: "success",
          posts: result.posts,
        });
      } else {
        res.json({ saved: "unsuccessful", error: { msg: "user not found" } });
      }
    });
};

exports.like_share_post = (req, res, next) => {
  const type = req.params.type;
  Post.findById(req.body.postId).exec(async (err, result) => {
    if (err) {
      throw err;
    }
    var index;
    if (type === "like") {
      index = result.likes.indexOf(req.user_detail.id);
      if (index === -1) {
        result.likes.push(req.user_detail.id);
      } else {
        result.likes.splice(index, 1);
      }
    } else {
      index = result.shares.indexOf(req.user_detail.id);
      if (index === -1) {
        result.shares.push(req.user_detail.id);
      } else {
        result.shares.splice(index, 1);
      }
    }
    var post = new Post(result);
    post.save(async (err) => {
      if (err) {
        return next(err);
      }
      if (index === -1) {
        await User.findOne({ posts: req.body.postId }).exec((err, result) => {
          if (err) {
            throw err;
          }
          if (result) {
            NotificationController.set_notifications(req, res, type, result);
          }
        });
      }
      res.json({ saved: "success" });
    });
  });
};

exports.likeComment = (req, res, next) => {
  Comment.findById(req.body.commentId)
    .populate("user_id")
    .exec(async (err, result) => {
      if (err) {
        return next(err);
      }
      var index = result.likes.indexOf(req.user_detail.id);
      if (index === -1) {
        result.likes.push(req.user_detail.id);
      } else {
        result.likes.splice(index, 1);
      }

      var comment = new Comment(result);
      comment.save(async (err) => {
        if (err) {
          throw err;
        }
        if (index === -1) {
          await User.findById(result.user_id).exec((err, user) => {
            if (err) {
              throw err;
            }
            if (user) {
              req.postId = result.postId;
              NotificationController.set_notifications(
                req,
                res,
                "likeComment",
                user
              );
            }
          });
        }
        res.json({ saved: "success" });
      });
    });
};

exports.homePosts = (req, res, next) => {
  User.findOne({ _id: req.user_detail.id }, "following")
    .populate({
      path: "following",
      select: "posts",
      populate: {
        path: "posts",
        populate: {
          path: "user_id",
          select: "f_name l_name username imageUri",
        },
      },
    })
    // .populate({
    //   path: "following",
    //   select: "following",
    //   populate: {
    //     path: "following",
    //     select: "posts",
    //     populate: {
    //       path: "posts",
    //       select: "f_name l_name username imageUri",
    //     },
    //   },
    // })
    .exec((err, result) => {
      if (result) {
        var data = [];
        result.following.map((item) => {
          item.posts.map((post) => {
            data.push({
              ...post._doc,
            });
          });
          // item.following.map((people) => {
          //   people.posts.map((post) => {
          //     data.push({
          //       ...post._doc,
          //     });
          //   });
          // });
        });
        res.json({ saved: "success", details: data });
      }
    });
};

exports.create_comment = [
  validator
    .body("text", "you cannot use more than 400 characters")
    .isLength({ max: 400 }),
  (req, res, next) => {
    console.log(req.body);
    Post.findById(req.body.postId).exec(async (err, result) => {
      if (err) {
        return next(err);
      }
      if (result) {
        var comment_detail = {
          commentText: req.body.text !== "null" ? req.body.text : null,
          user_id: req.user_detail.id,
          commentImg: [],
          commentImgId: [],
          postId: req.body.postId,
        };
        if (req.body.image !== "null") {
          req.files.map((file) => {
            comment_detail.commentImg.push(file.url);
            comment_detail.commentImgId.push(file.public_id);
          });
        } else {
          if (req.body.gif !== "null") {
            comment_detail.commentGif = req.body.gif;
          }
        }
        var comment = new Comment(comment_detail);
        await comment.save(async (err) => {
          if (err) {
            throw err;
          }
          result.comments.push(comment._id);
          var post = new Post(result);
          await Post.findByIdAndUpdate(post._id, post, {}, async (err) => {
            if (err) {
              throw err;
            }
            await User.findOne({ posts: post._id }).exec((err, result) => {
              if (err) {
                throw err;
              }
              NotificationController.set_notifications(
                req,
                res,
                "comment",
                result
              );
            });
            res.json({ saved: "success" });
          });
        });
      }
    });
  },
];

exports.find_post = (req, res, next) => {
  Post.findById(req.params.id)
    .populate({ path: "user_id", select: "f_name l_name username imageUri" })
    .populate({
      path: "comments",
      populate: {
        path: "user_id",
        select: "imageUri f_name l_name username",
      },
    })
    .populate({
      path: "comments",
      populate: {
        path: "sub_comments.user_id",
        select: "imageUri f_name l_name username",
      },
    })
    .exec((err, result) => {
      if (err) {
        return next(err);
      }
      if (result) {
        res.json({
          saved: "success",
          details: result,
        });
      }
    });
};

exports.commentOnComment = [
  validator
    .body("text", "you cannot use more than 400 characters")
    .isLength({ max: 400 }),
  (req, res, next) => {
    console.log(req.body);
    Comment.findById(req.body.commentId).exec(async (err, result) => {
      if (err) {
        return next(err);
      }
      if (result) {
        var comment_detail = {
          replyText: req.body["text"] !== "null" ? req.body["text"] : null,
          user_id: req.user_detail.id,
        };
        if (req.file) {
          comment_detail.replyImg = req.file.url;
          comment_detail.replyImgId = req.file.public_id;
        } else {
          if (req.body["gif"] !== "undefined") {
            comment_detail.replyGif = req.body["gif"];
          }
        }

        var newCmtObj = { ...result._doc };
        newCmtObj.sub_comments.push(comment_detail);
        var comment = new Comment(newCmtObj);
        await Comment.findByIdAndUpdate(comment._id, comment, {}, (err) => {
          if (err) {
            throw err;
          }
          res.json({ saved: "success" });
        });
      }
    });
  },
];

exports.trending_posts = (req, res, next) => {
  const fromIndex = Number(req.params.index);
  Post.aggregate([
    {
      $lookup: {
        from: "chat_users", //use the name of collection as in mongodb atlas not mongoose model
        localField: "user_id",
        foreignField: "_id",
        as: "user_id",
      },
    },
    {
      $project: {
        postText: 1,
        postImg: 1,
        postGif: 1,
        likes: 1,
        shares: 1,
        comments: 1,
        date: 1,
        embedLink: 1,
        postVideo: 1,
        "user_id._id": 1,
        "user_id.f_name": 1,
        "user_id.l_name": 1,
        "user_id.imageUri": 1,
        "user_id.username": 1,
        likesLenght: { $size: "$likes" },
        sharesLength: { $size: "$shares" },
        commentsLength: { $size: "$comments" },
      },
    },
    { $sort: { likesLength: -1, sharesLength: -1, commentsLength: -1 } },
    { $unwind: "$user_id" }, //if not used user_id will be array
  ]).exec((err, result) => {
    if (err) {
      throw err;
    }
    if (result) {
      res.json({
        saved: "success",
        data: result.slice(fromIndex, fromIndex + 5),
      });
    }
  });
};

exports.trending_videos = (req, res, next) => {
  const fromIndex = Number(req.params.index);
  Post.aggregate([
    {
      $match: {
        $or: [{ postVideo: { $ne: null } }, { embedLink: { $ne: null } }],
      },
    },
    {
      $lookup: {
        from: "chat_users", //use the name of collection as in mongodb atlas not mongoose model
        localField: "user_id",
        foreignField: "_id",
        as: "user_id",
      },
    },
    {
      $project: {
        postText: 1,
        postImg: 1,
        postGif: 1,
        likes: 1,
        shares: 1,
        comments: 1,
        date: 1,
        embedLink: 1,
        postVideo: 1,
        "user_id._id": 1,
        "user_id.f_name": 1,
        "user_id.l_name": 1,
        "user_id.imageUri": 1,
        "user_id.username": 1,
        likesLenght: { $size: "$likes" },
        sharesLength: { $size: "$shares" },
        commentsLength: { $size: "$comments" },
      },
    },
    { $sort: { likesLength: -1, sharesLength: -1, commentsLength: -1 } },
    { $unwind: "$user_id" }, //if not used user_id will be array
  ]).exec((err, result) => {
    if (err) {
      throw err;
    }
    if (result) {
      res.json({
        saved: "success",
        data: result.slice(fromIndex, fromIndex + 5),
      });
    }
  });
};

exports.likeReply = (req, res, next) => {
  Comment.findById(req.body.commentId).exec((err, result) => {
    if (err) {
      return next(err);
    }
    if (result) {
      var comment = { ...result._doc };
      comment.sub_comments.map((reply) => {
        if (reply._id.toString() === req.body.replyId.toString()) {
          const index = reply.likes.indexOf(req.user_detail.id);
          if (index === -1) {
            reply.likes.push(req.user_detail.id);
          } else {
            reply.likes.splice(index, 1);
          }
        }
      });
      const updatedCmt = new Comment(comment);
      Comment.findByIdAndUpdate(updatedCmt._id, updatedCmt, {}, (err) => {
        if (err) {
          return next(err);
        }
        res.json({ saved: "success" });
      });
    }
  });
};
