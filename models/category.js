module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    groupId: {
      type: DataTypes.INTEGER,
      reference: {
        model: 'Group',
        key: 'id',
        as: 'groupId'
      },
      allowNull: false
    },
    posOrder: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      defaultValue: []
    }
  }, {});
  Category.associate = function (models) {
    Category.belongsTo(models.Group, {
      foreignKey: 'groupId',
      onDelete: 'CASCADE'
    });
    Category.hasMany(models.Position, {
      foreignKey: 'categoryId',
    })
  };
  return Category;
};