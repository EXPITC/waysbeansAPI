require("dotenv").config();

module.exports = {
  development: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    host: process.env.HOST,
    dialect: "postgres",
    // You need diable this for local dev
    // dialectOptions: {
    //   ssl: {
    //     require: true,
    //   },
    // },
    PORT: process.env.PORT_DB,
  },
  test: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    host: process.env.HOST,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
      },
    },
    PORT: process.env.PORT_DB,
  },
  production: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    host: process.env.HOST,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: true,
      },
    },
    PORT: process.env.PORT_DB,
  },
};
