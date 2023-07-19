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

      this.belongsTo(models.Boats, {
        targetKey: "boatId",
        foreignKey: "boatId",
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
      boatId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: {
          model: "Boats",
          key: "boatId",
        },
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
