"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Reports extends Model {
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
      });

      this.belongsTo(models.Comments, {
        targetKey: "commentId",
        foreignKey: "commentId",
      });
    }
  }
  Reports.init(
    {
      reportId: {
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
      boatId: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      commentId: {
        type: DataTypes.INTEGER,
      },
      reportContent: {
        allowNull: false,
        type: DataTypes.TEXT("medium"),
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "Reports",
      timestamps: true,
      updatedAt: false,
    }
  );
  return Reports;
};
