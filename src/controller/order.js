const { order, transactions, products } = require("../../models");
const db = require("../database/connection");
const Op = require("sequelize").Op;
require("dotenv").config();

exports.addOrder = async (req, res) => {
  const t = await db.Sequelize.transaction();
  try {
    const data = req.body;
    const { transactionId } = data;
    const isValidBody =
      data.products.reduce(
        (condition, p) => (!p.productId || !p.qty ? false : condition),
        true
      ) && !!transactionId;

    if (!isValidBody) {
      await t.rollback();
      return res.status(500).send({
        status: "failed",
        message: "Cant retrive transaction Id, product Id, or quantity",
      });
    }

    const { products: dataProducts } = data;

    let price = 0;

    // Execute batch that sync with transaction & product
    for (const o of dataProducts) {
      const { productId, qty } = o; //Order;
      // Get data product for quantity
      const dataProduct = await products.findOne({
        where: { id: productId },
      });

      if (!dataProducts) throw Error("product cannot be found");

      // Product out of stock then return
      if (dataProduct.stock <= 0) {
        await t.rollback();
        return res.status(200).send({
          status: "product out stock",
          dataProduct,
        });
      }

      let dataOrder = await order.findOne({
        where: {
          transactionId,
          productId,
        },
      });

      // Execute base on previous order data has been created or not
      if (dataOrder) {
        // Update data order
        await dataOrder.increment({ qty }, { transaction: t });
      } else {
        // Create new data order
        dataOrder = await order.create(
          {
            productId,
            qty,
            transactionId,
            buyerId: req.user.id,
          },
          { transaction: t }
        );
      }

      // Sync stock
      await dataProduct.decrement({ stock: qty }, { transaction: t });

      price = price + dataProduct.price * qty;
    }

    // Update price in this Transaction price by new qty
    const dataTransaction = await transactions.findOne({
      where: { id: transactionId },
    });

    await dataTransaction.increment({ price }, { transaction: t });

    // Commit
    await t.commit();

    const updatedTransaction = await transactions.findOne({
      where: { id: transactionId },
      include: {
        model: products,
        as: "product",
        through: {
          model: order,
        },
        attributes: {
          exclude: ["createdAt", "updatedAt"],
        },
      },
    });

    res.status(200).send({
      status: "success add",
      data: {
        order: updatedTransaction.product,
      },
    });
  } catch (err) {
    await t.rollback();
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
exports.orderCount = async (req, res) => {
  try {
    const transaction = await transactions.findOne({
      where: {
        buyerId: req.user.id,
        status: {
          [Op.or]: ["Order"],
        },
      },
    });

    let userOrder = [];
    let total = 0;
    if (transaction) {
      userOrder = await order.findAll({
        where: {
          buyerId: req.user.id,
          transactionId: transaction.id,
        },
        attributes: {
          exclude: [
            "updateAt",
            "transactionId",
            "productId",
            "buyerId",
            "status",
          ],
        },
      });

      if (!userOrder) return;

      // total = userOrder.map((order) => order.qty);
      // total = total.reduce((a, b) => a + b, 0);
      total = userOrder.reduce((qty, order) => qty + order.qty, 0);
    }

    res.status(200).send({
      status: "success add",
      total,
      id: transaction?.id,
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const data = await order.findAll({
      where: { buyerId: buyerId },
      attributes: {
        include: ["id"],
      },
    });
    res.status(200).send({
      status: "success",
      data: {
        order: data,
      },
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
exports.getOrdersAdmin = async (_req, res) => {
  try {
    const data = await order.findAll({
      attributes: {
        include: ["id"],
      },
    });
    res.status(200).send({
      status: "success",
      data: {
        order: data,
      },
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
exports.getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.user.id;
    const data = await order.findOne({
      where: { id, buyerId: buyerId },
      attributes: {
        include: ["id"],
      },
    });
    if (!data) {
      return res.status(400).send({
        status: "failed",
        message: "order details not found",
      });
    }
    res.status(200).send({
      status: "success",
      data,
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.getOrderProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await order.findOne({
      where: {
        productId: id,
      },
    });
    res.status(200).send({
      status: "success",
      data,
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.user.id;
    const data = await order.findOne({
      where: { id, buyerId: buyerId },
    });
    if (!data) {
      return res.status(400).send({
        status: "failed",
        message: "order details not found",
      });
    }
    const newData = req.body;
    await order.update(newData, { where: { id } });
    res.status(200).send({
      status: "success",
      data,
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
exports.lessOrder = async (req, res) => {
  const t = await db.Sequelize.transaction();
  let isT = false; // for rollback;
  const t2 = await db.Sequelize.transaction();

  try {
    const data = req.body;
    const { transactionId } = data;

    const isValidBody =
      data.products.reduce(
        (condition, p) => (!p.productId || !p.qty ? false : condition),
        true
      ) && !!transactionId;

    if (!isValidBody) {
      await t.rollback();
      await t2.rollback();
      return res.status(500).send({
        status: "failed",
        message: "Cant retrive transaction Id, product Id, or quantity",
      });
    }

    const { products: dataProducts } = data;

    let price = 0;

    // loop for each product
    for (const o of dataProducts) {
      const { productId, qty } = o;

      // Get data product for quantity increment
      const dataProduct = await products.findOne({
        where: { id: productId },
      });

      if (!dataProducts) throw Error("product cannot be found");

      await dataProduct.increment({ stock: qty }, { transaction: t });

      // Get data order for quantity decrement
      const dataOrder = await order.findOne({
        where: {
          transactionId,
          productId,
        },
      });

      if (!dataOrder) throw Error("order cannot be found");

      await dataOrder.decrement({ qty }, { transaction: t });

      // Delete order if order qty reach zero
      if (dataOrder.qty <= 0)
        await order.destroy({
          where: { transactionId, productId },
          transaction: t,
        });

      price = price + dataProduct.price * qty;
    }

    // Update price in this Transaction price by new qty
    const dataTransaction = await transactions.findOne({
      where: { id: transactionId },
    });

    if (!dataTransaction) throw Error("transactions cannot be found");

    await dataTransaction.decrement({ price }, { transaction: t });

    await t.commit();
    isT = true;

    const updatedTransaction = await transactions.findOne({
      where: { id: transactionId },
      include: {
        model: products,
        as: "product",
        through: {
          model: order,
        },
        attributes: {
          exclude: ["createdAt", "updatedAt"],
        },
      },
    });

    // Destroy transaction if transactions have not product
    if (updatedTransaction.product.length <= 0) {
      await transactions.destroy({
        where: { id: transactionId },
        transaction: t2,
      });
    }
    await t2.commit();

    res.status(200).send({
      status: "success less",
      data: {
        order: updatedTransaction.product,
      },
    });
  } catch (err) {
    if (!isT) await t.rollback();
    await t2.rollback();

    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
exports.deletedOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.user.id;
    const orderData = await order.findOne({
      where: {
        id,
        buyerId: buyerId,
      },
    });
    if (!orderData) {
      return res.status(400).send({
        status: "fail",
        message: "order not found",
        data: {
          order: "order details not found",
        },
      });
    }
    const { productId, transactionId, qty } = orderData;
    const dataProduct = await products.findOne({
      where: { id: productId },
    });
    const dataTransaction = await transactions.findOne({
      where: { id: transactionId },
    });

    await transactions.update(
      {
        price: dataTransaction.price - qty * dataProduct.price,
      },
      {
        where: { id: transactionId },
      }
    );
    await products.update(
      {
        stock: dataProduct.stock + qty,
      },
      {
        where: {
          id: dataProduct.id,
        },
      }
    );
    await order.destroy({
      where: { id },
    });
    let x = await transactions.findOne({
      where: { id: transactionId },
      include: {
        model: products,
        as: "product",
        through: {
          model: order,
        },
        attributes: {
          exclude: ["createdAt", "updatedAt"],
        },
      },
    });
    if (x?.product < 1) {
      await transactions.destroy({
        where: { id: transactionId },
      });
    }
    res.send({
      status: "success",
      message: "order successfully destroy",
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
