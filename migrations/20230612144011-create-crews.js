"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Crews", {
      crewId: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      boatId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "Boats",
          key: "boatId",
        },
        onDelete: "CASCADE",
      },
      userId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "Users",
          key: "userId",
        },
        onDelete: "CASCADE",
      },
      nickName: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      isReleased: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Crews");
  },
};
