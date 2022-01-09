'use strict';

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
      await queryInterface.bulkInsert(
       'users',
       [
         {
           email: 'owner@mail.com',
           password: '$2b$08$4sDpJvJJ7msCddZ00n019.8O/ub9umIBe4wqivyDmGgDReAClyK9.8O/ub9umIBe4wqivy',  //123123
           fullname: 'owner',
           role: 'owner',
           image: 'LOFI.jpg'
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
  }
};
