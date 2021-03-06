var express = require("express");
var router = express.Router();

var userController = require("../controllers/user");
var postController = require("../controllers/post");
var messageController = require("../controllers/messages");
var notificationController = require("../controllers/notification");

var auth = require("../auth");
var mediaStorage = require("../mediaStorage");
var videoStorage = require("../videoStorage");

/* GET users listing. */
router.post("/login", userController.login);
router.get("/loginByToken", auth, userController.loginByToken);
router.post("/register", userController.register);
router.post("/signOut", auth, userController.signOut);
router.post("/profile", auth, userController.profile);
router.get("/profile/:id/follow", auth, userController.followPeople);
router.post("/update", auth, userController.user_update_post);
router.post("/search", userController.search);
router.post(
  "/profile/upload/:type",
  auth,
  mediaStorage.parserImage.single("image"),
  userController.upload_pic
);

router.post(
  "/profile/postWithImage",
  auth,
  mediaStorage.parserImage.array("image", 4),
  postController.create_post
);

router.post(
  "/profile/postWithVideo",
  auth,
  videoStorage.parserVideo.single("post-video"),
  postController.create_post
);

router.get("/post/:id", auth, postController.find_post);

router.post(
  "/profile/post/comment",
  auth,
  mediaStorage.parserImage.array("image", 4),
  postController.create_comment
);

router.post(
  "/comment/commentOnComment",
  auth,
  mediaStorage.parserImage.single("image"),
  postController.commentOnComment
);

router.post(
  "/comment/commentOnComment/like",
  auth,
  mediaStorage.parserImage.single("image"),
  postController.likeReply
);

router.get("/profile/:id/posts", auth, postController.user_posts);

router.post("/posts/:type", auth, postController.like_share_post);
router.post("/comment/like", auth, postController.likeComment);

router.get("/friend-list", auth, messageController.friend_list);

router.post("/getMsgBoxId", auth, messageController.getMessageBoxId);
router.get("/messages/:id/", auth, messageController.getMessages);

router.get("/homePosts/", auth, postController.homePosts);
router.get(
  "/notifications/:skip",
  auth,
  notificationController.get_notifications
);

router.get("/friend-suggesstions", auth, userController.friend_suggesstions);
router.get(
  "/get-trending-posts/from/:index",
  auth,
  postController.trending_posts
);

router.get(
  "/get-trending-videos/from/:index",
  auth,
  postController.trending_videos
);

router.post(
  "/uploadChatImage",
  auth,
  mediaStorage.parserImage.single("image"),
  messageController.uploadImageForChat
);

router.post(
  "/uploadChatVideo",
  auth,
  videoStorage.parserVideo.single("video"),
  messageController.uploadVideoForChat
);

module.exports = router;
