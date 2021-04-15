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
        type: DataTypes.FLOAT,
        allowNull: false
    },
    unitId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    imageId: {
        type: DataTypes.STRING,
        unique: true,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      reference: {
        model: 'Category',
        key: 'id',
        as: 'categoryId'
      },
      allowNull: false
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