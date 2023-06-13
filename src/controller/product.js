const { products, users } = require("../../models");
const { deleteImg } = require("../utils/cloudinary/deleteImage");
require("dotenv").config();

exports.getProducts = async (req, res) => {
  try {
    const sellerId = req.user.id;
    let data = await products.findAll({
      where: {
        sellerId: sellerId,
      },
      include: {
        model: users,
        as: "seller",
        attributes: {
          exclude: ["password", "createdAt", "updatedAt"],
        },
      },
      attributes: {
        exclude: ["sellerId", "createdAt", "updatedAt"],
      },
    });
    data = JSON.parse(JSON.stringify(data));

    res.status(200).send({
      status: "success",
      data: {
        products: data,
      },
    });
  } catch (err) {
    res.status(500).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.getProductsAll = async (_req, res) => {
  try {
    let data = await products.findAll({
      attributes: {
        exclude: ["sellerId", "createdAt", "updatedAt"],
      },
      order: [["createdAt", "DESC"]],
    });

    data = JSON.parse(JSON.stringify(data));

    res.status(200).send({
      status: "success",
      data: data,
    });
  } catch (err) {
    res.status(500).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let data = await products.findOne({
      where: {
        id,
      },
      include: {
        model: users,
        as: "seller",
        attributes: {
          exclude: ["password", "createdAt", "updatedAt"],
        },
      },
      attributes: {
        exclude: ["sellerId", "createdAt", "updatedAt"],
      },
    });
    if (!data) {
      return res.status(200).send({
        status: "failed",
        message: "product details not found",
      });
    }

    data = JSON.parse(JSON.stringify(data));

    res.status(200).send({
      status: "success",
      data,
    });
  } catch (err) {
    res.status(500).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.addProduct = async (req, res) => {
  try {
    const data = req.body;
    const response = await products.create({
      ...data,
      img: req.uploadImg.url,
      sellerId: req.user.id,
    });
    res.status(200).send({
      status: "success",
      message: "products successfully added",
      data: {
        products: {
          response,
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

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;
    const productData = await products.findOne({
      where: {
        id,
        sellerId: sellerId,
      },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });

    if (!productData) {
      return res.status(400).send({
        status: "fail",
        message: "product not found",
        data: {
          product: "product details not found",
        },
      });
    }

    await products.destroy({ where: { id } });

    await deleteImg(productData.img);

    res.send({
      status: "success",
      message: "product successfully destroy",
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id)
      return res.status(500).send({
        status: "fail",
        message: "fail to retrive id",
      });

    let data = req.body;
    const sellerId = req.user.id;

    const productData = await products.findOne({
      where: { id },
    });

    if (req.uploadImg && req.uploadImg.url !== productData.img) {
      data = {
        ...data,
        img: req.uploadImg.url,
      };
    }

    await products.update(data, { where: { id, sellerId: sellerId } });

    await deleteImg(productData.img);

    res.send({
      status: "success",
      message: "products successfully update",
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
