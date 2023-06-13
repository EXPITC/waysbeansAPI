require("dotenv").config();

const jwt = require("jsonwebtoken");

function isValidJwt(token, status) {
  if (!token) return false;
  if (status === "owner") {
    return jwt.verify(token, process.env.JWT_TOKEN, function (err, decoded) {
      if (err) return false;

      if (decoded.role !== status) return false;
      return true;
    });
  }
  return jwt.verify(token, process.env.JWT_TOKEN, function (err, decoded) {
    if (err) {
      console.err(err);
      return false;
    }
    return true;
  });
}

module.exports = isValidJwt;
