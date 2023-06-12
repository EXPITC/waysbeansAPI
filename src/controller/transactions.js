const { transactions, users, products, order } = require("../../models");
const db = require("../database/connection");
const Op = require("sequelize").Op;
require("dotenv").config();
const path = `${process.env.PATH_IMG}`;

exports.addTransaction = async (req, res) => {
  const t = await db.Sequelize.transaction();
  let isT = false; // Anticipate rollback cause crash

  const t2 = await db.Sequelize.transaction();

  try {
    const activeTransaction = await transactions.findOne({
      where: {
        buyerId: req.user.id,
        status: "Order",
      },
    });

    if (activeTransaction) {
      // I use 201 on purpose because 409 will be treat as err
      // while its still align with procedure
      await t.rollback();
      await t2.rollback();
      return res.status(201).send({
        status: "fail",
        message: `you still have transaction with status ${activeTransaction.status}`,
        activeTransaction,
      });
    }
    // Stop at here if user already have transaction and continues by adding to order

    let data = req.body;
    /* Body format
      body = {
        sellerId,
        products: [
          {
            productId: product.id,
            qty: 1,
          },
          {
            productId: 2,
            qty: 2,
          },
        ],
        transactionId: transaction.data.activeTransaction.id,
      };
      `transactionId` will be invalid when first create transaction also vice versa for `sellerId` 
    */

    const isValidBody = data.products.reduce(
      (condition, p) => (!p.productId || !p.qty ? false : condition),
      true
    );
    if (!isValidBody)
      throw new Error({ message: "fail to get product id or quantity" });

    let transaction = await transactions.create(
      {
        sellerId: data.sellerId,
        buyerId: req.user.id,
      },
      { transaction: t }
    );

    if (!transaction)
      throw new Error({ message: "failed to create new transaction" });

    transaction = JSON.parse(JSON.stringify(transaction));

    // Insert order (it can just one or mulitply)
    const dataOrder =
      data.products.map((order) => {
        return {
          ...order,
          transactionId: transaction.id,
          status: "pending",
          buyerId: req.user.id,
        };
      }) || [];
    await order.bulkCreate(dataOrder, { transaction: t });

    // Update quantity product
    for (const p of dataOrder) {
      const dataProduct = await products.findOne({
        where: { id: p.productId },
      });
      await dataProduct.decrement({ stock: p.qty }, { transaction: t });
    }

    await t.commit();
    isT = true; // Transaction one done

    // Update transactions price
    transaction = await transactions.findOne({
      where: {
        id: transaction.id,
      },
      include: [
        {
          model: users,
          as: "buyer",
          attributes: {
            exclude: ["password", "createdAt", "updatedAt"],
          },
        },
        {
          model: products,
          as: "product",
          through: {
            model: order,
          },
          attributes: {
            exclude: ["createdAt", "updatedAt"],
          },
        },
        {
          model: users,
          as: "seller",
          attributes: {
            exclude: ["password", "createdAt", "updatedAt"],
          },
        },
      ],
      attributes: {
        exclude: [
          "sellerId",
          "buyerId",
          "productId",
          "price",
          "createdAt",
          "updatedAt",
        ],
      },
    });

    // Count total price in one transaction
    // let total =
    //   transaction.product.map((p) => {
    //     return p.price * p.order.qty;
    //   }) || [];
    // sum all array int
    // total = total.reduce((a, b) => a + b, 0);

    price = transaction.product.reduce(
      (total, p) => total + p.price * p.order.qty,
      0
    );

    // The only reason this not use {transaction: t} because sequelize cannot retrive line 85 when created with transaction,
    // so at least do 90% with transaction and finish it.
    await transaction.increment({ price }, { transaction: t2 });
    await transaction.update(
      {
        name: transaction.buyer.dataValues.fullname,
        email: transaction.buyer.dataValues.email,
      },
      { transaction: t2 }
    );
    await t2.commit();

    res.status(200).send({
      status: "success add",
      data: {
        transaction,
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

exports.getTransactionUser = async (req, res) => {
  try {
    const thenTransaction = await transactions.findOne({
      where: {
        buyerId: req.user.id,
        status: "On The Way",
      },
    });
    if (!thenTransaction)
      return res.status(404).send({
        status: "failed",
        message: "transactions not found",
      });

    res.status(200).send({
      status: "success",
      data: thenTransaction,
    });
  } catch (err) {
    res.status(500).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
exports.getTransactionUserOrder = async (req, res) => {
  try {
    const thenTransaction = await transactions.findOne({
      where: {
        buyerId: req.user.id,
        status: "Order",
      },
    });

    res.status(200).send({
      status: "success",
      data: thenTransaction,
    });
  } catch (error) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
exports.getTransactions = async (req, res) => {
  try {
    const id = req.user.id;
    const data = await transactions.findOne({
      where: {
        buyerId: id,
        status: {
          [Op.or]: ["Waiting Approve", "On The Way", "Order"],
        },
      },
      include: [
        {
          model: users,
          as: "buyer",
          attributes: {
            exclude: ["password", "createdAt", "updatedAt"],
          },
        },
        {
          model: products,
          as: "product",
          through: {
            model: order,
          },
          attributes: {
            exclude: ["createdAt", "updatedAt"],
          },
        },
        {
          model: users,
          as: "seller",
          attributes: {
            exclude: ["password", "createdAt", "updatedAt"],
          },
        },
      ],
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });
    res.status(200).send({
      message: "Success",
      data: {
        transaction: data,
      },
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.getTransactionActive = async (req, res) => {
  try {
    const id = req.user.id;
    const dataTransaction = await transactions.findOne({
      where: {
        buyerId: id,
        status: "Order",
      },
      include: [
        {
          model: users,
          as: "buyer",
          attributes: {
            exclude: ["password", "createdAt", "updatedAt"],
          },
        },
        {
          model: products,
          as: "product",
          through: {
            model: order,
            attributes: {
              include: ["id"],
            },
            order: [["createdAt", "DESC"]],
          },
          attributes: {
            exclude: ["updatedAt"],
          },
          order: [["createdAt", "DESC"]],
        },
        {
          model: users,
          as: "seller",
          attributes: {
            exclude: ["password", "createdAt", "updatedAt"],
          },
        },
      ],
      attributes: {
        exclude: ["updatedAt"],
      },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).send({
      message: "Success",
      data: {
        transaction: dataTransaction,
      },
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.getTransactionsAdmin = async (req, res) => {
  try {
    const data = await transactions.findAll({
      include: [
        {
          model: users,
          as: "buyer",
          attributes: {
            exclude: ["password", "createdAt", "updatedAt"],
          },
        },
        {
          model: products,
          as: "product",
          through: {
            model: order,
            attributes: {
              include: ["id"],
            },
          },
          attributes: {
            exclude: ["createdAt", "updatedAt"],
          },
        },
        {
          model: users,
          as: "seller",
          attributes: {
            exclude: ["password", "createdAt", "updatedAt"],
          },
        },
      ],
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });
    res.status(200).send({
      message: "Success",
      data: {
        transactions: data,
      },
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.getTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await transactions.findOne({
      where: {
        id,
      },
      include: [
        {
          model: users,
          as: "buyer",
          attributes: {
            exclude: ["password", "createdAt", "updatedAt"],
          },
        },
        {
          model: products,
          as: "product",
          through: {
            model: order,
            attributes: {
              include: ["id"],
            },
          },
          attributes: {
            exclude: ["createdAt", "updatedAt"],
          },
        },
        {
          model: users,
          as: "seller",
          attributes: {
            exclude: ["password", "createdAt", "updatedAt"],
          },
        },
      ],
      attributes: {
        exclude: ["updatedAt"],
      },
    });

    res.status(200).send({
      status: "Success",
      transaction,
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.editTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transactionData = await transactions.findOne({
      where: {
        id,
      },
    });
    if (!transactionData) {
      return res.status(400).send({
        status: "fail",
        message: "transaction not found",
        data: {
          transaction: "transaction details not found",
        },
      });
    }
    const data = req.body;
    const transaction = await transactions.update(
      {
        ...data,
        // attachment: req.uploadImg.url // Only for manual payment
      },
      { where: { id } }
    );
    res.send({
      status: "successfully",
      message: "transaction successfully edit",
      transaction,
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const buyerId = req.user.id;
    const transactionData = await transactions.findOne({
      where: {
        id,
        buyerId: buyerId,
      },
    });
    if (!transactionData) {
      return res.status(400).send({
        status: "fail",
        message: "transaction not found",
        data: {
          transaction: "transaction details not found",
        },
      });
    }
    await transactions.destroy({
      where: { id },
    });
    res.send({
      status: "success",
      message: "transaction successfully destroy",
    });
  } catch (err) {
    res.status(409).send({
      status: "failed",
      message: "server error: " + err.message,
    });
  }
};
