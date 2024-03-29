const express = require("express");
const router = express.Router();
const { uploadImg } = require("../middleware/uploadImg");
const { userCheck, admin, owner } = require("../middleware/userCheck");

// Auth
const { register, login, auth } = require("../controller/auth");

router.post("/register", register);
router.post("/login", login);

router.get("/auth", userCheck, auth); // When user already have token store;

// User
const {
  getUsers,
  getUser,
  updateUser,
  updateUserData,
  // deleteUser,
  profileMe,
} = require("../controller/user");

router.get("/profile", userCheck, profileMe);

router.get("/users", getUsers);
router.get("/user/:id", getUser);
router.patch("/user", userCheck, uploadImg("image", true), updateUser);
router.patch("/userData", userCheck, updateUserData);
// router.delete("/user/:id", userCheck, admin, deleteUser);

// Rating
const { token, comments, updateRating } = require("../controller/rating");

router.patch("/rating/:id", userCheck, updateRating);
router.get("/rating/token/:id", userCheck, token);
router.get("/rating/:id", comments);

// Product
// TODO: delete product, edit product ,get product
const {
  addProduct,
  getProducts,
  getProductsAll,
  getProduct,
  editProduct,
  deleteProduct,
} = require("../controller/product");

router.post("/add/product/", userCheck, owner, uploadImg("image"), addProduct);
router.get("/products", userCheck, owner, getProducts);
router.get("/products/all", getProductsAll);
router.get("/product/:id", getProduct);
router.patch(
  "/product/:id",
  userCheck,
  owner,
  uploadImg("image", true),
  editProduct
);

router.delete("/product/:id", userCheck, owner, deleteProduct);

// transaction
// TODO: add transaction , get transactions, get transactions of id , get transaction , delete transaction.
const {
  addTransaction,
  getTransactions,
  getTransactionsAdmin,
  getTransaction,
  editTransaction,
  deleteTransaction,
  getTransactionUser,
  getTransactionActive,
  getTransactionUserOrder,
} = require("../controller/transactions");

router.post("/add/transaction", userCheck, addTransaction);
router.get("/transaction/user", userCheck, getTransactionUser);
router.get("/transaction/user/Order", userCheck, getTransactionUserOrder);
router.get("/transactions", userCheck, getTransactions);
router.get("/transaction/active", userCheck, getTransactionActive);
router.get("/transactions/admin", userCheck, admin, getTransactionsAdmin);
router.get("/transaction/:id", userCheck, getTransaction);
router.patch(
  "/transaction/:id",
  userCheck,
  // uploadImg("attachment", true), //Only for manual payment feat `false`
  editTransaction
);
router.delete("/transaction/:id", userCheck, deleteTransaction);

//order
const {
  addOrder,
  getOrders,
  getOrdersAdmin,
  getOrder,
  getOrderProduct,
  updateOrder,
  deletedOrder,
  orderCount,
  lessOrder,
} = require("../controller/order");

router.post("/add/order", userCheck, addOrder);
router.post("/less/order", userCheck, lessOrder);
router.get("/orders", userCheck, getOrders);
router.get("/order/count", userCheck, orderCount);
router.get("/orders/admin", userCheck, admin, getOrdersAdmin);
router.get("/order/:id", userCheck, getOrder);
router.get("/order/product/:id", getOrderProduct);
router.patch("/order/:id", userCheck, updateOrder);
router.delete("/order/:id", userCheck, deletedOrder);

module.exports = router;
