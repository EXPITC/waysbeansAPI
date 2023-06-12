const { users, resto, products } = require("../../models");
const { deleteImg } = require("../utils/cloudinary/deleteImage");
require("dotenv").config();

exports.getUsers = async function (_req, res) {
  try {
    let usersData = await users.findAll({
      attributes: {
        exclude: ["password", "createdAt", "updatedAt"],
      },
    });

    usersData = JSON.parse(JSON.stringify(usersData));

    res.status(200).send({
      status: "success",
      massage: "users successfully retrieved",
      data: {
        users: {
          usersData,
        },
      },
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = await users.findOne({
      attributes: {
        exclude: ["password", "createdAt", "updatedAt"],
      },
      where: { id },
    });
    userData
      ? res.status(200).send({
          status: "success",
          message: "user successfully retrieved",
          data: {
            user: userData,
          },
        })
      : res.status(400).send({
          status: "fail",
          message: "user not found",
          data: {
            user: "user details not found",
          },
        });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
exports.profileMe = async (req, res) => {
  try {
    const { id } = req.user;
    const userData = await users.findOne({
      attributes: {
        exclude: ["password", "createdAt", "updatedAt"],
      },
      where: { id },
    });
    userData
      ? res.status(200).send({
          status: "success",
          message: "user successfully retrieved",
          data: {
            user: userData,
          },
        })
      : res.status(400).send({
          status: "fail",
          message: "user not found",
          data: {
            user: "user details not found",
          },
        });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.user;
    let data = req.body;

    const user = await users.findOne({
      where: { id },
    });

    if (!user)
      return res.send({
        status: "fail",
        message: "user cannot be found",
      });

    const isNewImage = req.uploadImg?.url && req.uploadImg?.url != user.image;

    if (isNewImage) {
      data = {
        ...data,
        image: req.uploadImg.url,
      };
    }

    const update = await users.update({ ...data }, { where: { id } });

    if (update[0] !== 1)
      return res.send({
        status: "failed",
        message: "fail to update",
      });

    if (isNewImage && user.image !== process.env.DEFAULT_PROFILE)
      await deleteImg(user.image);

    res.status(200).send({
      status: "success",
      message: "user successfully update",
    });
  } catch (err) {
    res.status(500).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
exports.updateUserData = async (req, res) => {
  try {
    const { id } = req.user;
    const data = req.body;
    await users.update(
      {
        ...data,
      },
      {
        where: { id },
      }
    );

    res.send({
      status: "success",
      message: "user successfully update",
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = await users.findOne({
      where: { id },
    });
    if (!userData) {
      return res.status(400).send({
        status: "fail",
        message: "user not found",
        data: {
          user: "user details not found",
        },
      });
    }
    await users.destroy({
      where: { id },
    });
    res.send({
      status: "success",
      message: "user successfully destroy",
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.getUserResto = async (req, res) => {
  try {
    const { id } = req.params;
    const userData = await users.findOne({
      where: { id },
      include: {
        model: resto,
        as: "resto",
        attributes: {
          exclude: ["ownerId", "createdAt", "updatedAt"],
        },
      },
    });
    if (!userData) {
      return res.send({
        status: "failed",
        message: "acc was not found",
      });
    }
    if (userData.role == "costumer") {
      return res.send({
        status: "failed",
        message: "acc was costumer",
      });
    }

    res.send({
      status: "success",
      data: {
        userData,
      },
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
exports.getUserRestos = async (req, res) => {
  try {
    const userData = await users.findAll({
      where: { role: "owner" },
      include: {
        model: resto,
        as: "restos",
        attributes: {
          exclude: ["createdAt", "updatedAt"],
        },
      },
    });
    if (!userData) {
      return res.send({
        status: "failed",
        message: "acc was not found",
      });
    }

    res.send({
      status: "success",
      data: {
        userData,
      },
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
