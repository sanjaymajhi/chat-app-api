const async = require("async");
var validator = require("express-validator");

const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");
const Sub_Comment = require("../models/sub_comments");

exports.create_post = [
  validator
    .body("post-text", "you cannot use more than 400 characters")
    .isLength({ max: 400 }),
  async (req, res) => {
    const errors = validator.validationResult(req);
    if (!errors.isEmpty()) {
      res.json({
        saved: "unsuccessful",
        errors: errors.array(),
      });
      return;
    }
    var post_detail = { postText: req.body["post-text"] };
    if (req.file) {
      post_detail.postImg = req.file.url;
      post_detail.postImgId = req.file.public_id;
    } else {
      if (req.body["post-gif"] !== "undefined") {
        post_detail.postGif = req.body["post-gif"];
      }
    }
    var post = new Post(post_detail);
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
    .populate("posts")
    .exec((err, result) => {
      if (err) {
        throw err;
      }
      if (result) {
        res.json({ saved: "success", posts: result.posts });
      } else {
        res.json({ saved: "unsuccessful", error: { msg: "user not found" } });
      }
    });
};

exports.like_share_post = (req, res) => {
  const type = req.params.type;
  Post.findById(req.body.post_id).exec((err, result) => {
    if (err) {
      throw err;
    }

    if (type === "like") {
      const index = result.likes.indexOf(req.user_detail.id);
      if (index === -1) {
        result.likes.push(req.user_detail.id);
      } else {
        result.likes.splice(index, 1);
      }
    } else {
      const index = result.shares.indexOf(req.user_detail.id);
      if (index === -1) {
        result.shares.push(req.user_detail.id);
      } else {
        result.shares.splice(index, 1);
      }
    }
    var post = new Post(result);
    post.save((err) => {
      if (err) {
        throw err;
      }
      res.json({ saved: "success" });
    });
  });
};

exports.homePosts = (req, res) => {
  User.findById(req.user_detail.id)
    .populate({
      path: "following",
      populate: {
        path: "posts",
      },
    })
    .populate({
      path: "following",
      populate: {
        path: "following",
        populate: {
          path: "posts",
        },
      },
    })
    .exec((err, result) => {
      if (result) {
        var data = [];
        result.following.map((item) => {
          item.posts.map((post) => {
            data.push({
              ...post._doc,
              name: item.f_name + " " + item.l_name,
              username: item.username,
              user_imageUri: item.imageUri,
              user_id: item._id,
            });
          });
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
    console.log(req.body.postId);
    Post.findById(req.body.postId).exec(async (err, result) => {
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
        var comment = new Comment(comment_detail);
        await comment.save(async (err) => {
          if (err) {
            throw err;
          }
          result.comments.push(comment._id);
          var post = new Post(result);
          await Post.findByIdAndUpdate(post._id, post, {}, (err) => {
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

exports.find_post = (req, res) => {
  async.parallel(
    {
      post_detail: (callback) =>
        Post.findById(req.params.id).populate("comments").exec(callback),
      user_detail: (callback) =>
        User.findOne({ posts: req.params.id }).exec(callback),
    },
    (err, result) => {
      if (err) {
        throw err;
      }
      if (result) {
        res.json({
          saved: "success",
          details: {
            ...result.post_detail._doc,
            imageUri: result.user_detail.imageUri,
            name: result.user_detail.f_name + " " + result.user_detail.l_name,
            username: result.user_detail.username,
          },
        });
      }
    }
  );
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
