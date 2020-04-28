const async = require("async");
var validator = require("express-validator");

const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");

exports.create_post = [
  validator
    .body("post-text", "you cannot use more than 400 characters")
    .isLength({ max: 200 }),
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
      post_detail.postGif = req.body["post-gif"];
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

exports.like_post = (req, res) => {
  console.log(req.body);
  Post.findById(req.body.post_id).exec((err, result) => {
    if (err) {
      throw err;
    }
    console.log(result);
    result.likes += 1;
    var post = new Post(result);
    post.save((err) => {
      if (err) {
        throw err;
      }
      res.json({ status: "saved" });
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
