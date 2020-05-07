var jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    res.json({
      saved: "unsuccessful",
      error: { msg: "You are not logged in..." },
    });
    return;
  }
  try {
    const decoded = jwt.verify(token, "sanjay");
    req.user_detail = decoded.user;
    next();
  } catch {
    return res.status(500).redirect("/user/login/");
  }
};
