const async = require("async");
var validator = require("express-validator");

const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");
const NotificationController = require("../controllers/notification");

exports.create_post = [
  validator
    .body("post-text", "you cannot use more than 400 characters")
    .isLength({ max: 400 }),
  async (req, res) => {
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
      postText: req.body["post-text"] !== "null" ? req.body["post-text"] : null,
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
    if (req.body["post-video"] !== "null") {
      post_detail.postVideo = req.file.url;
      post_detail.postVideoId = req.file.public_id;
    }
    var post = new Post(post_detail);
    console.log(post);
    await post.save((err) => {
      if (err) {
        throw err;
      }
    });
    var postId = post._id;
    await User.findById(req.user_detail.id).exec(async (err, result) => {
      if (err) {
        throw err;
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

exports.user_posts = (req, res) => {
  User.findOne({ username: "@" + req.params.id }, "posts")
    .populate({
      path: "posts",
      populate: { path: "user_id", select: "f_name l_name username imageUri" },
    })
    .exec((err, result) => {
      if (err) {
        throw err;
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

exports.like_share_post = (req, res) => {
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
        throw err;
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

exports.homePosts = (req, res) => {
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
    .body("post-text", "you cannot use more than 400 characters")
    .isLength({ max: 400 }),
  (req, res) => {
    console.log(req.body);
    Post.findById(req.body.postId).exec(async (err, result) => {
      if (err) {
        throw err;
      }
      if (result) {
        var comment_detail = {
          postText:
            req.body["post-text"] !== "null" ? req.body["post-text"] : null,
          user_id: req.user_detail.id,
          postImg: [],
          postImgId: [],
          postId: req.body.postId,
        };
        if (req.body["image"] !== "null") {
          req.files.map((file) => {
            comment_detail.postImg.push(file.url);
            comment_detail.postImgId.push(file.public_id);
          });
        } else {
          if (req.body["post-gif"] !== "null") {
            comment_detail.postGif = req.body["post-gif"];
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

exports.find_post = (req, res) => {
  Post.findById(req.params.id)
    .populate({ path: "user_id", select: "f_name l_name username imageUri" })
    .populate({
      path: "comments",
      populate: {
        path: "user_id",
        select: "imageUri f_name l_name username",
      },
    })
    .exec((err, result) => {
      if (err) {
        throw err;
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
    .body("post-text", "you cannot use more than 400 characters")
    .isLength({ max: 400 }),
  (req, res) => {
    console.log(req.body.postId);
    Comment.findById(req.body.commentId).exec(async (err, result) => {
      if (err) {
        throw err;
      }
      if (result) {
        var comment_detail = {
          postText: req.body["post-text"],
          userId: req.user_detail.id,
        };
        if (req.file) {
          comment_detail.postImg = req.file.url;
          comment_detail.postImgId = req.file.public_id;
        } else {
          if (req.body["post-gif"] !== "undefined") {
            comment_detail.postGif = req.body["post-gif"];
          }
        }
        var sub_comment = new Sub_Comment(comment_detail);
        await sub_comment.save(async (err) => {
          if (err) {
            throw err;
          }
          result.sub_comments.push(sub_comment._id);
          var comment = new Post(result);
          await Comment.findByIdAndUpdate(comment._id, comment, {}, (err) => {
            if (err) {
              throw err;
            }
            res.json({ saved: "success" });
          });
        });
      }
    });
  },
];

exports.trending_posts = (req, res) => {
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

exports.trending_videos = (req, res) => {
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
