var async = require("async");
var mongoose = require("mongoose");
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken"); //for recaptcha
var validator = require("express-validator");

var User = require("../models/user");

exports.profile = (req, res) => {
  User.findOne({ username: req.body.username }).exec((err, details) => {
    if (details) {
      res.status(200).json(details);
    } else {
      res.send("no token");
    }
  });
};

exports.followPeople = (req, res) => {
  User.findOne({ username: "@" + req.params.id }).exec((err, person) => {
    if (err) {
      throw err;
    }
    User.findById(req.user_detail.id).exec(async (err, result) => {
      if (err) {
        throw err;
      }
      result.following.push(person._id);
      var user = new User({
        f_name: result.f_name,
        l_name: result.l_name,
        email: result.email,
        password: result.password,
        method: result.method,
        imageUri: result.imageUri,
        username: result.username,
        location: result.location,
        bio: result.bio,
        followers: result.followers,
        following: result.following,
        join_date: result.join_date,
        coverImageUri: result.coverImageUri,
        _id: result._id,
      });

      await User.findByIdAndUpdate(user._id, user, (err) => {
        if (err) {
          throw err;
        }
        res.json({ saved: "success" });
      });
    });
  });
};

exports.upload_profile_pic = async (req, res) => {
  const image = {};
  image.url = req.file.url;
  image.id = req.file.public_id;
  User.findById(req.user_detail.id).exec(async (err, result) => {
    if (err) {
      throw err;
    }
    var user = new User({
      f_name: result.f_name,
      l_name: result.l_name,
      email: result.email,
      password: result.password,
      method: result.method,
      imageUri: image.url,
      username: result.username,
      location: result.location,
      bio: result.bio,
      followers: result.followers,
      following: result.following,
      join_date: result.join_date,
      coverImageUri: result.coverImageUri,
      imageUriId: image.id,
      _id: result._id,
    });

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
    { username: new RegExp(req.body.name, "i") },
    "f_name l_name imageUri username"
  ).exec((err, details) => {
    if (details) {
      console.log(details);
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

  validator.sanitizeBody("f_name").escape(),
  validator.sanitizeBody("l_name").escape(),

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
          f_name: req.body.f_name,
          l_name: req.body.l_name,
          password: password,
          email: req.body.email,
          method: req.body.method,
          imageUri: req.body.imageUri,
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

  validator.sanitizeBody("*").escape(),

  (req, res) => {
    console.log(req.body);
    const errors = validator.validationResult(req);
    if (!errors.isEmpty()) {
      res.json({
        saved: "unsuccessful",
        errors: errors.array(),
      });
      return;
    }
    User.findOne({ username: "@" + req.body.username }).exec((err, result) => {
      if (err) {
        throw err;
      }
      if (result) {
        res.json({
          saved: "unsuccessful",
          error: { msg: "Username already exists..." },
        });
        return;
      } else {
        User.findOne({ _id: req.user_detail.id }).exec(async (err, result) => {
          if (err) {
            throw err;
          }
          var user = new User({
            f_name: req.body.f_name,
            l_name: req.body.l_name,
            email: result.email,
            password: result.password,
            method: result.method,
            imageUri: result.imageUri,
            username: "@" + req.body.username,
            location: req.body.location,
            bio: req.body.bio,
            followers: result.followers,
            following: result.following,
            join_date: result.join_date,
            coverImageUri: result.coverImageUri,
            _id: result._id,
          });
          await User.findByIdAndUpdate(user._id, user, (err) => {
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

exports.login = [
  validator
    .body("email", "Invalid Email or Password")
    .isLength({ min: 5 })
    .trim(),
  validator.body("password", "Invalid Password").isLength({ min: 5 }).trim(),

  validator.sanitizeBody("*").escape(),

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

    User.findOne({ email: req.body.email }, "email password username").exec(
      async (err, result) => {
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
            { expiresIn: 10000 },
            (err, token) => {
              if (err) {
                throw err;
              }
              res.status(200).json({
                saved: "success",
                token: token,
                username: result.username.split("@")[1],
              });
            }
          );
        }
      }
    );
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

  validator.sanitizeBody("c_pass").escape(),
  validator.sanitizeBody("n_pass").escape(),
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
          var user = new User({
            f_name: result.f_name,
            l_name: result.l_name,
            dob: result.dob,
            mobile: result.mobile,
            username: result.username,
            password: password,
            gender: result.gender,
            email: result.email,
            _id: req.user_detail.id,
            trains_booked: result.trains_booked,
          });
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
