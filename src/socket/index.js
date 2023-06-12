const {
  transactions,
  users,
  products,
  order,
  rating,
} = require("../../models");
const Op = require("sequelize").Op;
// const { userCheck, admin, owner } = require("../middleware/userCheck");
const isValidJwt = require("../utils/jwt/isValidJwt");
const jwt = require("jsonwebtoken");
const db = require("../database/connection");
const fetch = require("node-fetch");
require("dotenv").config();

const PAYMENT_SERVER_KEY = process.env.PAYMENT_SERVER_KEY;
const PAYMENT_TOKEN_GENERATE_URL = process.env.PAYMENT_TOKEN_GENERATE_URL;

const socketIo = (io) => {
  io.use(async (socket, next) => {
    if (isValidJwt(socket.handshake?.auth?.token)) {
      next();
    } else {
      next(new Error("Not Authorized"));
    }
  });
  io.on("connection", (socket) => {
    console.info("client connect:", socket.id);

    socket.on("loadTransaction", async () => {
      try {
        const token = socket.handshake.auth.token;
        const verified = jwt.verify(token, process.env.JWT_TOKEN);

        const { id } = verified;
        if (!id) return;
        let data = await transactions.findAll({
          where: {
            [Op.or]: [{ buyerId: id }, { sellerId: id }],
            status: {
              [Op.or]: ["Success", "Cancel", "On The Way", "Waiting Approve"],
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
          order: [["createdAt", "DESC"]],
        });

        socket.emit("transaction", data);
      } catch (err) {
        console.error(err.message);
      }
    });

    socket.on("pay", async (form) => {
      if (!PAYMENT_SERVER_KEY || !PAYMENT_TOKEN_GENERATE_URL)
        return console.error("Payment server key not found./:79/socket-pay");

      if (!form) return console.error("form have no payment data");
      const timeStamp = () => Math.round(new Date().getTime() / 1000);

      // Body request to create payment token
      const body = JSON.stringify({
        transaction_details: {
          order_id: `${form.id}-${form.buyer.id}-${timeStamp()}`,
          gross_amount: form.total,
        },
        credit_card: {
          secure: true,
        },
        customer_details: {
          first_name: form.name.split(" ")[0],
          last_name: form.name.split(" ")[1] || null,
          email: form.email,
          phone: form.phone,
        },
      });

      const options = {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          authorization:
            "Basic " + Buffer.from(PAYMENT_SERVER_KEY).toString("base64"),
        },
        body,
      };

      let token;
      await fetch(PAYMENT_TOKEN_GENERATE_URL, options)
        .then((res) => res.json())
        .then((json) => (token = json.token))
        .catch((err) => console.error("error:" + err));

      socket.emit("paymentToken", token);
    });

    socket.on("order", async (payload) => {
      const id = payload;
      if (!id) return console.error("transaction id not found");
      try {
        const res = await transactions.update(
          { status: "Waiting Approve" },
          // { status: "Order" },
          { where: { id } }
        );
        if (res[0] !== 1) return console.error("transactions fail to update"); // Update not success;

        const data = await transactions.findOne({
          where: { id: id },
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
        socket.emit("orderData", data);
      } catch (err) {
        console.error(err.message);
      }
    });

    socket.on("newTransaction", async () => {
      const data = await transactions.findAll({
        where: {
          status: {
            [Op.or]: ["Success", "Cancel", "On The Way", "Waiting Approve"],
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
        ],
        order: [["createdAt", "DESC"]],
      });
      console.log(data);
      socket.broadcast.emit("newTransactionData", data);
    });

    // Confirm for client
    socket.on("confirm", async (id) => {
      if (!id) return console.error("need id transaction");

      const transaction = await db.Sequelize.transaction();
      try {
        const data = await transactions.update(
          { status: "Success" },
          { where: { id }, transaction }
        );
        await transaction.commit();

        socket.emit("ConfirmData", data);
      } catch (err) {
        await transaction.rollback();
        console.error(err.massage);
      }
    });

    socket.on("subscribe/update/transaction", (roomBuyer) => {
      socket.join(roomBuyer);
    });
    socket.on("unsubscribe/update/transaction", (roomBuyer) => {
      socket.leave(roomBuyer);
    });

    // Accept & Cancel for admin
    socket.on("accept", async (id) => {
      if (!id) return console.error("need id transaction");
      const token = socket?.handshake?.auth?.token;
      if (!isValidJwt(token, "owner")) return console.error("owner only");

      const transaction = await db.Sequelize.transaction();
      try {
        const update = await transactions.update(
          { status: "On The Way" },
          { where: { id }, transaction }
        );
        if (update[0] !== 1) return console.error("fail to update");
        const data = await transactions.findOne({
          where: { id },
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

        ratingToken = data.product.map((p) => {
          return {
            productsId: p.id,
            userId: data.buyerId,
            status: "token",
          };
        });
        await rating.bulkCreate(ratingToken, { transaction });

        await transaction.commit();
        data.status = "On The Way";

        socket.emit("acceptData", data);
        const roomBuyer = "update/transaction/" + data.buyerId;
        console.log(roomBuyer);

        socket.to(roomBuyer).emit("update/transaction");
      } catch (err) {
        await transaction.rollback();
        console.log(err.massage);
      }
    });
    socket.on("cancel", async (id) => {
      if (!id) return console.error("need id transaction");
      const token = socket?.handshake?.auth?.token;
      if (!isValidJwt(token, "owner")) return console.error("owner only");

      const transaction = await db.Sequelize.transaction();
      try {
        const update = await transactions.update(
          { status: "Cancel" },
          { where: { id }, transaction }
        );
        if (update[0] !== 1) return console.error("fail to update");
        await transaction.commit();

        const data = await transactions.findOne({
          where: { id },
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
        socket.emit("cancelData", data);
      } catch (err) {
        await transaction.rollback();
        console.log(err.massage);
      }
    });
    // socket.on("transaction", async () => {
    //   try {
    //     const token = socket?.handshake?.auth?.token;
    //     if (isValidJwt(token, "owner")) return console.error("owner only");
    //     const verified = jwt.verify(token, process.env.JWT_TOKEN);
    //
    //     const data = await transactions.findAll({
    //       where: {
    //         [Op.or]: [{ buyerId: verified.id }, { sellerId: verified.id }],
    //         status: {
    //           [Op.or]: ["Success", "Cancel", "On The Way", "Waiting Approve"],
    //         },
    //       },
    //       include: [
    //         {
    //           model: users,
    //           as: "buyer",
    //           attributes: {
    //             exclude: ["password", "createdAt", "updatedAt"],
    //           },
    //         },
    //         {
    //           model: products,
    //           as: "product",
    //           through: {
    //             model: order,
    //           },
    //           attributes: {
    //             exclude: ["createdAt", "updatedAt"],
    //           },
    //         },
    //       ],
    //       order: [["createdAt", "DESC"]],
    //     });
    //     // console.log(data)
    //     socket.emit("transactionData", data);
    //   } catch (err) {
    //     console.log(err.message);
    //   }
    // });
    socket.on("onTheWay", async (payload) => {
      try {
        let data = transactions.findOne({
          where: {
            buyerId: payload,
            status: "On The Way",
          },
        });
        console.log(data);
        socket.emit("otwData", data);
      } catch (err) {
        console.log(err.massage);
      }
    });
    socket.on("disconnect", () => {
      console.log("client disconnect");
    });
  });
};

module.exports = socketIo;
