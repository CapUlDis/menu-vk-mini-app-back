module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Groups', [{
      groupId: 1,
      linkVkFood: 'test',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      groupId: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      groupId: 3,
      linkVkFood: 'foo',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Groups', null, {});
  }
};
