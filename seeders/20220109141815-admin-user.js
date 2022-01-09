'use strict';
const { users } = require('../models')
require('dotenv').config();

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
     let valid = await users.findOne({
      where: {email : 'owner@mail.com'}
      })

      if (valid) {
        console.log('already have owner')  
        console.log(process.env.PORT)
        console.log(process.env.PATH_IMG)
      } else {
        await queryInterface.bulkInsert(
         'users',
         [
           {
             email: 'owner@mail.com',
             password: '$2b$08$4sDpJvJJ7msCddZ00n019.8O/ub9umIBe4wqivyDmGgDReAClyK9.8O/ub9umIBe4wqivy',  //123123
             fullname: 'owner',
             role: 'owner',
             image: 'LOFI.jpg',
             createdAt: '2021-12-23 00:24:21',
             updatedAt: '2021-12-23 00:24:21'
           },
         ],
         {}
       );
      }
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
