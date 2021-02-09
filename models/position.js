module.exports = (sequelize, DataTypes) => {
  const Position = sequelize.define('Position', {
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false
    },
    value: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    unit: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.STRING,
        allowNull: false
    },
    image: {
        type: DataTypes.BLOB,
    },
    index: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    categoryId: {
      type: DataTypes.INTEGER,
      reference: {
        model: 'Category',
        key: 'id',
        as: 'categoryId'
      }
    }
  }, {});
  Position.associate = function (models) {
    Position.belongsTo(models.Category, {
      foreignKey: 'categoryId',
      onDelete: 'CASCADE'
    });
  };
  return Position;
};