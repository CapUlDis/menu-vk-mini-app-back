module.exports = (sequelize, DataTypes) => {
  const Position = sequelize.define('Position', {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 50]
      }
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 100]
      }
    },
    value: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        isFloat: true,
        min: 0
      }
    },
    unitId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: true,
        min: 0,
        max: 3
      }
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        isFloat: true,
        min: 0
      }
    },
    imageId: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        len: [20, 60]
      }
    },
    categoryId: {
      type: DataTypes.INTEGER,
      reference: {
        model: 'Category',
        key: 'id',
        as: 'categoryId'
      },
      allowNull: false,
      validate: {
        isInt: true,
        min: 0
      }
    }
  }, {
    validate: {
      async limitPosPerCat() {
        if (await Position.count({ where: { categoryId: this.categoryId }}) >= process.env.POS_PER_CAT) {
          throw new Error('Limit for positions per this category exceeded.');
        }
      }
    }
  });
  Position.associate = function (models) {
    Position.belongsTo(models.Category, {
      foreignKey: 'categoryId',
      onDelete: 'CASCADE'
    });
  };
  return Position;
};