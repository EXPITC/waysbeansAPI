require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const router = require("./src/routers");

const cors = require("cors");
const http = require("http");

const { Server } = require("socket.io");
const httpServer = http.createServer(app);

app.use(express.json());

// Enable this for local dev
// app.use(cors());

const corsConf = {
  origin: process.env.FE_ORIGIN,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "OPTIONS", "PATCH", "DELETE", "POST", "PUT"],
};

app.use(cors(corsConf));
app.options(process.env.FE_ORIGIN, cors(corsConf));

// For manual payment, store at local
// app.use("/img", express.static("./uploads/img"));

// Default route
app.get("/", function (_req, res) {
  res.send({
    message: "check ok!",
  });
});

// API route
app.use("/api/v1/", router);

httpServer.listen(port, () => {
  console.info(`listen port ${port}`);
});

// WSS init
const io = new Server(httpServer, {
  cors: {
    origin: `${process.env.FE_ORIGIN}`,
    credentials: true, // Disable this for local dev
    methods: ["GET", "POST"],
  },
});

require("./src/socket")(io);
