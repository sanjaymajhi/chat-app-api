var express = require("express");
var router = express.Router();

var userController = require("../controllers/user");
var postController = require("../controllers/post");
var messageController = require("../controllers/messages");
var auth = require("../auth");
var mediaStorage = require("../mediaStorage");

/* GET users listing. */
router.post("/login", userController.login);
router.post("/register", userController.register);
router.post("/profile", auth, userController.profile);
router.post("/profile/:id/follow", auth, userController.followPeople);
router.post("/update", auth, userController.user_update_post);
router.post("/search", userController.search);
router.post(
  "/profile/upload/profile-image",
  auth,
  mediaStorage.parser.single("image"),
  (req, res) => userController.upload_pic(req, res, "profile")
);

router.post(
  "/profile/upload/profile-cover-image",
  auth,
  mediaStorage.parser.single("image"),
  (req, res) => userController.upload_pic(req, res, "profile-cover")
);

router.post(
  "/profile/post",
  auth,
  mediaStorage.parser.single("image"),
  postController.create_post
);

router.post("/profile/:id/posts", auth, postController.user_posts);

router.post("/posts/like", auth, postController.like_post);

router.post("/friend-list", auth, messageController.friend_list);
router.post("/messages", auth, messageController.getMessages);
router.post(
  "/sendMsg",
  auth,
  mediaStorage.parser.single("image"),
  messageController.sendMessage
);

router.post("/homePosts", auth, postController.homePosts);

module.exports = router;
