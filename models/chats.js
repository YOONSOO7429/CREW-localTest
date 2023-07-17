"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Chats extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.Users, {
        targetKey: "userId",
        foreignKey: "userId",
        onDelete: "CASCADE",
      });

      this.belongsTo(models.Rooms, {
        targetKey: "roomId",
        foreignKey: "roomId",
        onDelete: "CASCADE",
      });
    }
  }
  Chats.init(
    {
      chatId: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      userId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: {
          model: "Users",
          key: "userId",
        },
        onDelete: "CASCADE",
      },
      roomId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: {
          model: "Rooms",
          key: "roomId",
        },
        onDelete: "CASCADE",
      },
      chatMessage: {
        type: DataTypes.TEXT,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "Chats",
      timestamps: true,
      updatedAt: false,
    }
  );
  return Chats;
};
