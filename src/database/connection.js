const S = require("sequelize");

const db = {};
// after root should be password bcoz i don't have password so leave it empty
const Sequelize = new S(
  process.env.POSTGRES_DB,
  process.env.POSTGRES_USER,
  process.env.POSTGRES_PASSWORD,
  {
    host: process.env.HOST,
    dialect: "postgres",
    dialectModule: require("pg"),
    // Disable ssl below for local dev
    // dialectOptions: {
    //   ssl: {
    //     require: true,
    //   },
    // },
    // Stop at here
    logging: console.info,
    freezeTableName: true,
    pool: {
      max: 5,
      min: 0,
      acquired: 60000,
      idle: 5000,
    },
    retry: {
      match: [/Deadlock/i],
      max: 3, // Maximum rety 3 times
      backoffBase: 1000, // Initial backoff duration in ms. Default: 100,
      backoffExponent: 1.5, // Exponent to increase backoff each try. Default: 1.1
    },
  }
);

db.Sequelize = Sequelize;

module.exports = db;
