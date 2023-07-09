"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Boats", {
      boatId: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
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
      email: {
        allowNull: false,
        type: Sequelize.STRING,
        references: {
          model: "Users",
          key: "email",
        },
        onDelete: "CASCADE",
      },
      captain: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      title: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      content: {
        allowNull: false,
        type: Sequelize.TEXT("medium"),
      },
      keyword: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      maxCrewNum: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      endDate: {
        type: Sequelize.STRING,
      },
      latitude: {
        allowNull: false,
        type: Sequelize.DOUBLE,
      },
      longitude: {
        allowNull: false,
        type: Sequelize.DOUBLE,
      },
      address: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      isDone: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
      },
      deletedAt: {
        type: Sequelize.DATE,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Boats");
  },
};
