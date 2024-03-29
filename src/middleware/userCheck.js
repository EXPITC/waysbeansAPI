require("dotenv").config();
const jwt = require("jsonwebtoken");

exports.userCheck = async (req, res, next) => {
  const auth = req.header("Authorization");

  const token = auth && auth.split(" ")[1];

  if (!token) {
    return res.status(400).send({
      status: "failed",
      messsage: "Invalid token",
    });
  }

  try {
    const verify = jwt.verify(token, process.env.JWT_TOKEN);

    // res.send(verify)
    req.user = verify;

    next();
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.admin = async (req, res, next) => {
  try {
    const { status } = req.user;

    if (status != "admin") {
      return res.status(400).send({
        status: "not admin",
      });
    }
    next();
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.owner = async (req, res, next) => {
  try {
    const { role } = req.user;

    if (role === undefined)
      return res.status(400).send({
        status: "fail",
        message: "status/role not found",
      });

    if (role !== "owner")
      return res.status(400).send({
        status: "not owner",
      });

    next();
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
