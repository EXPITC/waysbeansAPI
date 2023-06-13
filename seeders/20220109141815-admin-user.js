"use strict";
const { users } = require("../models");
require("dotenv").config();

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    let isCreated = await users.findOne({
      where: { email: "owner@waysbeans.com" },
    });
    if (isCreated)
      return console.info("Owner already created, id:", isCreated.id);
    await queryInterface.bulkInsert(
      "users",
      [
        {
          email: "owner@waysbeans.com",
          password:
            "$2b$08$9m7ndjAYTA8b1xFNqGrqTemgAu47oOGoxPuQi5t89nwyBcZWRVBzq", //12345678
          fullname: "owner",
          role: "owner",
          image: process.env.DEFAULT_PROFILE,
          createdAt: "2021-12-23 00:24:21",
          updatedAt: "2021-12-23 00:24:21",
        },
        {
          email: "customer@customer.com",
          password:
            "$2b$08$9m7ndjAYTA8b1xFNqGrqTemgAu47oOGoxPuQi5t89nwyBcZWRVBzq", //dont forget to align with ur JWT token
          fullname: "customer",
          role: "customer",
          image: process.env.DEFAULT_PROFIEL_CUSTOMER,
          createdAt: "2021-12-23 00:24:21",
          updatedAt: "2021-12-23 00:24:21",
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
