const Sequelize = require("sequelize");

class User extends Sequelize.Model {
  static initiate(sequelize) {
    //테이블 설정
    User.init(
      {
        email: {
          type: Sequelize.STRING(40),
          allowNull: true,
          unique: true,
        },
        nick: {
          type: Sequelize.STRING(15),
          allowNull: false,
        },
        password: {
          type: Sequelize.ENUM("local", "kakao"),
          allowNull: false,
          defaultValue: "local",
        },
        sendId: {
          type: Sequelize.STRING(30),
          allowNull: true,
        },
      },
      {
        // validation : 생성 전 검사 기능
        sequelize,
        timestamps: true, //createdAt, updatedAt
        underscored: false, //Camelcase
        modelName: "User",
        tableName: "users",
        paranoid: true, //deleteAt 유저 삭제일 //soft delete
        charset: "utf8mb4",
        collate: "utf8mb4_general_ci",
      }
    );
  }

  state_asccociate(db) {
    db.User.hasMany(db.Post);
    db.User.belongsToMany(db.User, {
      foreignKey: "followingId",
      as: "Followers",
      through: "Follow",
    });
    db.User.belongsToMany(db.User, {
      foreignKey: "followerId",
      as: "Followings",
      through: "Follow",
    });
  }
}

module.exports = User;
