var async = require("async");
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var validator = require("express-validator");

var User = require("../models/user");
var notificationController = require("../controllers/notification");

exports.profile = (req, res) => {
  User.findOne({ username: req.body.username }).exec((err, details) => {
    if (details) {
      res.status(200).json({ details: details, id: req.user_detail.id });
    } else {
      res.send("no token");
    }
  });
};

exports.followPeople = (req, res) => {
  async.parallel(
    {
      userToDetails: (callback) =>
        User.findOne({ username: "@" + req.params.id }).exec(callback),
      userWhoDetails: (callback) =>
        User.findById(req.user_detail.id).exec(callback),
    },
    async (err, result) => {
      if (err) {
        throw err;
      }
      const userToDetails = result.userToDetails;
      const userWhoDetails = result.userWhoDetails;
      var shouldSendNotific = false;

      if (userToDetails.followers.indexOf(userWhoDetails._id) === -1) {
        userToDetails.followers.push(userWhoDetails._id);
        shouldSendNotific = true;
      } else {
        let index = userToDetails.followers.indexOf(userWhoDetails._id);
        userToDetails.followers.splice(index, 1);
      }
      if (userWhoDetails.following.indexOf(userToDetails._id) === -1) {
        userWhoDetails.following.push(userToDetails._id);
      } else {
        let index = userWhoDetails.following.indexOf(userToDetails._id);
        userWhoDetails.following.splice(index, 1);
      }
      var userToFollow = new User(userToDetails);
      var userWhoFollow = new User(userWhoDetails);
      await User.findByIdAndUpdate(userToFollow._id, userToFollow, (err) => {
        if (err) {
          throw err;
        }
        shouldSendNotific
          ? notificationController.set_notifications(
              req,
              res,
              "follow",
              userToFollow
            )
          : "";
      });
      await User.findByIdAndUpdate(userWhoFollow._id, userWhoFollow, (err) => {
        if (err) {
          throw err;
        }
        res.json({ saved: "success" });
      });
    }
  );
};

exports.upload_pic = async (req, res) => {
  const type = req.params.type;
  const image = {};
  image.url = req.file.url;
  image.id = req.file.public_id;
  User.findById(req.user_detail.id).exec(async (err, result) => {
    if (err) {
      throw err;
    }
    if (type === "profile") {
      var pics = {
        imageUriId: image.id,
        imageUri: image.url,
        coverImageUri: result.coverImageUri,
        coverImageUriId: result.coverImageUriId,
      };
    } else {
      var pics = {
        imageUriId: result.imageUriId,
        imageUri: result.imageUri,
        coverImageUri: image.url,
        coverImageUriId: image.id,
      };
    }

    var user_detail = { ...result._doc, ...pics };
    console.log(user_detail);
    var user = new User(user_detail);

    await User.findByIdAndUpdate(user._id, user, (err) => {
      if (err) {
        throw err;
      }
      res.status(200).json({ saved: "success" });
    });
  });
};

exports.search = (req, res) => {
  User.find(
    {
      f_name: new RegExp(req.body.value, "i"),
    },
    "f_name l_name imageUri username"
  ).exec((err, details) => {
    if (err) {
      throw err;
    }
    if (details) {
      res.status(200).json(details);
    }
  });
};

exports.register = [
  validator
    .body("f_name", "First Name should have min 2 and max 20 characters")
    .trim()
    .isLength({ min: 2, max: 20 }),
  validator
    .body("l_name", "Last Name should have min 2 and max 20 characters")
    .trim()
    .isLength({ min: 2, max: 20 }),
  validator
    .body("password", "password length min 8 and max 15")
    .trim()
    .isLength({ min: 8, max: 15 }),
  validator.body("email", "Invalid Email").trim().isEmail(),

  (req, res) => {
    if (req.body.method === "native") {
      const errors = validator.validationResult(req);
      if (!errors.isEmpty()) {
        res.json({
          saved: "unsuccessful",
          errors: errors.array(),
        });
        return;
      }
    }
    User.find({ email: req.body.email }, "email").exec(async (err, email) => {
      if (err) {
        throw err;
      }
      if (email.length) {
        res.json({
          saved: "unsuccessful",
          error: { msg: "Email already exists" },
        });
        return;
      } else {
        if (req.body.method === "native") {
          var salt = await bcrypt.genSalt(10);
          var password = await bcrypt.hash(req.body.password, salt);
          req.body.imageUri = undefined;
        }
        var user = new User({
          f_name:
            req.body.f_name.charAt(0).toUpperCase() + req.body.f_name.slice(1),
          l_name:
            req.body.l_name.charAt(0).toUpperCase() + req.body.l_name.slice(1),
          password: password,
          email: req.body.email,
          method: req.body.method,
          imageUri: req.body.imageUri,
          username: "@" + req.body.email.split("@")[0],
        });

        await user.save((err) => {
          if (err) {
            throw err;
          }

          res.status(200).json({ saved: "success" });
        });
      }
    });
  },
];

exports.user_update_post = [
  validator
    .body("f_name", "First Name should be min 2 and max 20 characters long.")
    .trim()
    .isLength({ min: 2, max: 20 }),
  validator
    .body("l_name", "Last Name should be min 2 and max 20 characters long.")
    .trim()
    .isLength({ min: 2, max: 20 }),
  validator
    .body("username", "Username should be min 5 and max 20 characters long.")
    .trim()
    .isLength({ min: 5, max: 20 })
    .isAlphanumeric()
    .withMessage("Only Alpha numeric charcaters allowed in username"),
  validator
    .body("location", "Location should be min 1 and max 40 characters long.")
    .trim()
    .isLength({ min: 1, max: 40 }),
  validator
    .body("bio", "Bio should be min 10 and max 200 characters long.")
    .trim()
    .isLength({ min: 10, max: 200 }),

  (req, res) => {
    const errors = validator.validationResult(req);
    if (!errors.isEmpty()) {
      res.json({
        saved: "unsuccessful",
        errors: errors.array(),
      });
      return;
    }

    async.parallel(
      {
        usernameCheck: (callback) =>
          User.findOne({ username: "@" + req.body.username }).exec(callback),
        user_details: (callback) =>
          User.findOne({ _id: req.user_detail.id }).exec(callback),
      },
      (err, result) => {
        if (err) {
          throw err;
        }
        const usernameCheck = result.usernameCheck;
        const user_details = result.user_details;
        if (
          usernameCheck != undefined &&
          user_details.username !== usernameCheck.username
        ) {
          res.json({
            saved: "unsuccessful",
            error: { msg: "Username already exists..." },
          });
          return;
        } else {
          User.findOne({ _id: req.user_detail.id }).exec(
            async (err, result) => {
              if (err) {
                throw err;
              }
              var userCopy = {
                ...result._doc,
                f_name:
                  req.body.f_name.charAt(0).toUpperCase() +
                  req.body.f_name.slice(1),
                l_name:
                  req.body.l_name.charAt(0).toUpperCase() +
                  req.body.l_name.slice(1),
                username: "@" + req.body.username,
                location: req.body.location,
                bio: req.body.bio,
              };
              var user = new User(userCopy);
              await User.findByIdAndUpdate(user._id, user, (err) => {
                if (err) {
                  throw err;
                }
                res.json({ saved: "success" });
              });
            }
          );
        }
      }
    );
  },
];

exports.login = [
  validator
    .body("email", "Invalid Email or Password")
    .isLength({ min: 5 })
    .trim()
    .isEmail(),
  validator.body("password", "Invalid Password").isLength({ min: 5 }).trim(),

  (req, res) => {
    if (req.body.method === "native") {
      const errors = validator.validationResult(req);
      if (!errors.isEmpty()) {
        res.json({
          saved: "unsuccessful",
          errors: errors.array(),
        });
        return;
      }
    }

    User.findOne({ email: req.body.email }).exec(async (err, result) => {
      if (err) {
        throw err;
      }
      if (!result) {
        res.json({
          saved: "unsuccessful",
          error: { msg: "Email does not exists" },
        });
        return;
      } else {
        if (req.body.method === "native") {
          const isMatch = await bcrypt.compare(
            req.body.password,
            result.password
          );

          if (!isMatch) {
            res.json({
              saved: "unsuccessful",
              error: { msg: "Incorrect password" },
            });
            return;
          }
        }

        var payload = {
          user: {
            id: result._id,
          },
        };
        await jwt.sign(
          payload,
          "sanjay",
          { expiresIn: 3600 },
          async (err, token) => {
            if (err) {
              throw err;
            }
            var userCopy = {
              ...result._doc,
              last_login: Date.now(),
              isLoggedIn: true,
            };
            await User.findByIdAndUpdate(userCopy._id, userCopy, {}, (err) => {
              if (err) {
                throw err;
              }
            });
            res.status(200).json({
              saved: "success",
              token: token,
              _id: result._id,
              username: result.username.split("@")[1],
              f_name: result.f_name,
              l_name: result.l_name,
              imageUri: result.imageUri,
            });
          }
        );
      }
    });
  },
];

exports.change_pass = [
  validator
    .body("c_pass", "old password cannot be empty")
    .isLength({ min: 1 })
    .trim(),
  validator
    .body("n_pass", "new password length min 8 and max 15")
    .isLength({ min: 8, max: 15 })
    .trim(),

  (req, res) => {
    const errors = validator.validationResult(req);
    if (!errors.isEmpty()) {
      res.json({ saved: "unsuccessful", error: errors.array() });
      return;
    }
    User.findOne({ _id: req.user_detail.id }).exec(async (err, result) => {
      if (err) {
        throw err;
      }
      if (result == null) {
        res.json({
          saved: "unsuccessful",
          error: { msg: "user does not exist" },
        });
        return;
      } else {
        const isMatch = await bcrypt.compare(req.body.c_pass, result.password);
        if (!isMatch) {
          res.json({
            saved: "unsuccessful",
            error: { msg: "Incorrect password" },
          });
          return;
        } else {
          var salt = await bcrypt.genSalt(10);
          var password = await bcrypt.hash(req.body.n_pass, salt);
          var userCopy = result;
          var user = new User({});
          await User.findByIdAndUpdate(user._id, user, (err) => {
            if (err) {
              throw err;
            }
            res.json({ saved: "success" });
          });
        }
      }
    });
  },
];

exports.friend_suggesstions = (req, res) => {
  User.findById(req.user_detail.id)
    .select("following")
    .populate({
      path: "following",
      select: "following",
      populate: {
        path: "following",
        select: "_id f_name l_name username imageUri",
      },
    })
    .exec((err, result) => {
      if (err) {
        throw err;
      }
      if (result) {
        //own id and own friends id
        const notNeeded = [];
        result.following.map((item) => notNeeded.push(item._id.toString()));
        notNeeded.push(req.user_detail.id);

        //new friend suggesstions
        const ids = [];
        const data = [];
        result.following.map((item) => {
          item.following.map((people) => {
            if (
              ids.indexOf(people._id) === -1 &&
              notNeeded.indexOf(people._id.toString()) === -1
            ) {
              ids.push(people._id);
              data.push(people);
            }
          });
        });
        res.json({ saved: "success", data: data });
      }
    });
};
