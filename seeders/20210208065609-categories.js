module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Categories', [{
      title: 'Завтраки',
      index: 0,
      groupId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: 'Напитки',
      index: 1,
      groupId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: 'Супы',
      index: 2,
      groupId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Categories', null, {});
  }
};
