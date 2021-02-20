module.exports = (sequelize, DataTypes) => {
  const Group = sequelize.define('Group', {
    vkGroupId: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false
    },
    linkVkFood: DataTypes.STRING,
    catOrder: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      defaultValue: []
    }
  }, {});
  Group.associate = function (models) {
    Group.hasMany(models.Category, {
      foreignKey: 'groupId',
    })
  };
  return Group;
};