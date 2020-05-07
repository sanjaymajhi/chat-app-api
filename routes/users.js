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
router.get("/profile/:id/follow", auth, userController.followPeople);
router.post("/update", auth, userController.user_update_post);
router.post("/search", userController.search);
router.post(
  "/profile/upload/:type",
  auth,
  mediaStorage.parser.single("image"),
  userController.upload_pic
);

router.post(
  "/profile/post",
  auth,
  mediaStorage.parser.single("image"),
  postController.create_post
);

router.get("/post/:id", auth, postController.find_post);

router.post(
  "/profile/post/comment",
  auth,
  mediaStorage.parser.single("image"),
  postController.create_comment
);

router.post(
  "/profile/post/commentOnComment",
  auth,
  mediaStorage.parser.single("image"),
  postController.commentOnComment
);

router.get("/profile/:id/posts", auth, postController.user_posts);

router.post("/posts/:type", auth, postController.like_share_post);

router.get("/friend-list", auth, messageController.friend_list);
router.post("/messages", auth, messageController.getMessages);
router.post(
  "/sendMsg",
  auth,
  mediaStorage.parser.single("image"),
  messageController.sendMessage
);

router.get("/homePosts", auth, postController.homePosts);

router.get("/notifications", auth, userController.get_notifications);

module.exports = router;
