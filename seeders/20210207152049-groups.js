module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Groups', [{
      vkGroupId: 1,
      linkVkFood: 'test',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      vkGroupId: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      vkGroupId: 3,
      linkVkFood: 'foo',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Groups', null, {});
  }
};
