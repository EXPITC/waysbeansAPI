"use strict";

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
      "products",
      [
        {
          title: "NICARAGUA Beans",
          price: 250900,
          stock: 352,
          description:
            "Hampir semua referensi sepakat mengatakan bahwa kopi pertama kali ditemukan di Ethiopia, meskipun ada juga beberapa protes yang menyatakan bahwa Coffea arabica sebenarnya muncul pertama kali di bagian selatan Sudan. Karena para gembala Ethiopia adalah manusia pertama yang mengonsumsi kopi—walau saat itu mereka baru mengonsumsi buah/cherry-nya saja, maka gagasan tentang “Ethiopia sebagai tempat asal kopi” pun semakin kuat.",
          img: "https://res.cloudinary.com/ddyqlp99r/image/upload/q_auto:good/v1685621288/waysbeans/aoruyujktzv15vizco0m.png",
          sellerId: 1,
          createdAt: "2021-12-23 00:24:21",
          updatedAt: "2021-12-23 00:24:21",
        },
        {
          title: "GUETEMALA Beans",
          price: 300900,
          stock: 500,
          description:
            "Hampir semua referensi sepakat mengatakan bahwa kopi pertama kali ditemukan di Ethiopia, meskipun ada juga beberapa protes yang menyatakan bahwa Coffea arabica sebenarnya muncul pertama kali di bagian selatan Sudan. Karena para gembala Ethiopia adalah manusia pertama yang mengonsumsi kopi—walau saat itu mereka baru mengonsumsi buah/cherry-nya saja, maka gagasan tentang “Ethiopia sebagai tempat asal kopi” pun semakin kuat.",
          img: "https://res.cloudinary.com/ddyqlp99r/image/upload/q_auto:good/v1685621220/waysbeans/ty3nvpghrxp7xvqwi1lu.png",
          sellerId: 1,
          createdAt: "2021-12-23 00:24:21",
          updatedAt: "2021-12-23 00:24:21",
        },
        {
          title: "ETHIOPIA Beans",
          price: 109900,
          stock: 99,
          description:
            "Hampir semua referensi sepakat mengatakan bahwa kopi pertama kali ditemukan di Ethiopia, meskipun ada juga beberapa protes yang menyatakan bahwa Coffea arabica sebenarnya muncul pertama kali di bagian selatan Sudan. Karena para gembala Ethiopia adalah manusia pertama yang mengonsumsi kopi—walau saat itu mereka baru mengonsumsi buah/cherry-nya saja, maka gagasan tentang “Ethiopia sebagai tempat asal kopi” pun semakin kuat.",
          img: "https://res.cloudinary.com/ddyqlp99r/image/upload/q_auto:good/v1685831739/waysbeans/pskkrpo0qhrlyrgz3fft.png",
          sellerId: 1,
          createdAt: "2021-12-23 00:24:21",
          updatedAt: "2021-12-23 00:24:21",
        },
        {
          title: "RWANDA Beans",
          price: 299900,
          stock: 200,
          description:
            "Hampir semua referensi sepakat mengatakan bahwa kopi pertama kali ditemukan di Ethiopia, meskipun ada juga beberapa protes yang menyatakan bahwa Coffea arabica sebenarnya muncul pertama kali di bagian selatan Sudan. Karena para gembala Ethiopia adalah manusia pertama yang mengonsumsi kopi—walau saat itu mereka baru mengonsumsi buah/cherry-nya saja, maka gagasan tentang “Ethiopia sebagai tempat asal kopi” pun semakin kuat.",
          img: "https://res.cloudinary.com/ddyqlp99r/image/upload/q_auto:good/v1685621101/waysbeans/xnctwxdllomtknz8usrm.png",
          sellerId: 1,
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
