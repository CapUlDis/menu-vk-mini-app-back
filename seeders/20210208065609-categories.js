module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Categories', [{
      title: 'Завтраки',
      groupId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: 'Напитки',
      groupId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: 'Супы',
      groupId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Categories', null, {});
  }
};
