const Sequelize = require("sequelize");

class User extends Sequelize.Model {
  static initiate(sequelize) {
    User.init(
      {
        memberId: {
          type: Sequelize.BIGINT,
          allowNull: false,
          unique: true,
          autoIncrement: true,
          primaryKey: true,
        },
        userType: {
          type: Sequelize.STRING(15),
          allowNull: false,
        },
        nickname: {
          type: Sequelize.STRING(15),
          allowNull: false,
        },
        gender: {
          type: Sequelize.STRING(15),
          allowNull: false,
        },
        birthYear: {
          type: Sequelize.BIGINT,
          allowNull: false,
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: false,
        modelName: "User",
        tableName: "users",
        paranoid: true, //deleteAt 유저 삭제일
        charset: "utf8", //utf8mb4
        collate: "utf8_general_ci",
      }
    );
  }
  static associate(db) {}
}

module.exports = User;
