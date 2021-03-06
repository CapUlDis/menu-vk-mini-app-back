module.exports = (sequelize, DataTypes) => {
  const Group = sequelize.define('Group', {
    vkGroupId: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
      validate: {
        isInt: true,
        min: 0,
        max: 10000000000
      }
    },
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