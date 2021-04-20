module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 30],
      }
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
  }, {
    validate: {
      async limitCatsPerGroup() {
        if (await Category.count({ where: { groupId: this.groupId }}) >= process.env.CATS_PER_GROUP) {
          throw new Error('Limit for categories per this group exceeded.');
        }
      }
    }
  });
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