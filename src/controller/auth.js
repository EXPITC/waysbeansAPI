const { users } = require("../../models");
require("dotenv").config();

const joi = require("joi");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const schema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(4).required(),
    fullname: joi.string().min(3).required(),
    image: joi.string().optional(),
  });
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(401).send({
      err: error.details[0].message,
    });
  }
  try {
    let { email } = req.body;
    email = email.toLowerCase();
    let isUser = await users.findOne({
      where: { email },
    });

    if (isUser) {
      return res.status(201).send({
        status: "failed",
        message: "acc already exists",
      });
    }

    const salt = await bcrypt.genSalt(8);
    const hashPass = await bcrypt.hash(req.body.password, salt);

    await users.create({
      fullname: req.body.fullname,
      email: email,
      password: hashPass,
      role: "costumer",
      image: process.env.DEFAULT_PROFILE,
    });

    isUser = await users.findOne({
      where: { email },
    });

    if (!isUser)
      return res.status(500).send({
        status: "failed",
        message: "Acc fail to create",
      });

    isUser = JSON.parse(JSON.stringify(isUser));

    const userData = {
      id: isUser.id,
      status: isUser.role,
    };

    const token = jwt.sign(userData, process.env.JWT_TOKEN);

    res.status(200).send({
      status: "success",
      message: "successfully register",
      data: {
        user: {
          token,
          ...isUser,
        },
      },
    });
  } catch (err) {
    res.status(500).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.login = async (req, res) => {
  const schema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(4).required(),
  });
  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(401).send({
      err: error.details[0].message,
    });
  }

  try {
    const { email, password } = req.body;
    let userAcc = await users.findOne({
      where: { email: email.toLowerCase() },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });

    const sendErr = () => {
      return res.status(400).send({
        status: "failed",
        message: "email or password wrong",
      });
    };

    if (!userAcc.email) return sendErr();
    userAcc = JSON.parse(JSON.stringify(userAcc));

    const isValid = await bcrypt.compare(password, userAcc.password);
    if (!isValid) return sendErr();

    const userData = {
      id: userAcc.id,
      status: userAcc.role,
    };

    const token = jwt.sign(userData, process.env.JWT_TOKEN);

    delete userAcc.password;

    res.status(200).send({
      status: "login",
      token,
      ...userAcc,
    });
  } catch (err) {
    res.status(500).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.auth = async (req, res) => {
  try {
    const sendErr = () => {
      return res.status(400).send({
        status: "failed",
        message: "Token not valid",
      });
    };

    const { id } = req.user;
    if (!id) return sendErr();

    let userAcc = await users.findOne({
      where: { id },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });
    if (!userAcc) return sendErr();

    userAcc = JSON.parse(JSON.stringify(userAcc));

    const userData = {
      id,
      role: userAcc.role,
    };

    const token = jwt.sign(userData, process.env.JWT_TOKEN);

    res.status(200).send({
      status: "login",
      token,
      ...userAcc,
    });
  } catch (err) {
    res.status(500).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
