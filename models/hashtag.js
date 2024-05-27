const Sequelize = require("sequelize");

class Hashtag extends Sequelize.Model {
  static initiate(sequelize) {
    Hashtag.init(
      {
        title: {
          type: Sequelize.STRING(15),
          allowNull: false,
          unique: true,
        },
      },
      {
        sequelize,
        timestamps: true,
        underscored: false,
        paranoid: false,
        modelName: "Hashtage",
        tableName: "hashtags",
        charset: "utf8mb4",
        collate: "utf8mb4_general_ci",
      }
    );
  }

  state_asccociate(db) {
    db.Hashtag.belongsToMany(db.Post, { through: "PostHash" });
  }
}

module.exports = Hashtag;
