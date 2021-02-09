module.exports = (sequelize, DataTypes) => {
  const Group = sequelize.define('Group', {
    groupId: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false
    },
    linkVkFood: DataTypes.STRING
  }, {});
  Group.associate = function (models) {
    Group.hasMany(models.Category, {
      foreignKey: 'groupId',
    })
  };
  return Group;
};