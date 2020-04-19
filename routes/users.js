var express = require("express");
var router = express.Router();

var userController = require("../controllers/user");
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

module.exports = router;
