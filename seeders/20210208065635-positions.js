module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('Positions', [{
      title: 'Каша пшеная',
      description: 'На выбор: на воде, на молоке, на кокосовом молоке, на миндальном молоке',
      value: 200,
      unitId: 1,
      price: 23,
      imageId: 'kllvz8787',
      categoryId: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: 'Творог с ягодами',
      description: 'Творог с натуральным йогуртом и свежими ягодами',
      value: 200,
      unitId: 2,
      price: 589,
      imageId: 'kllv343z',
      categoryId: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: 'Смузи боул киви-шпинат',
      description: 'Смузи из киви и шпината с добавлением клубники, черники и украшенный орехами.',
      value: 330,
      unitId: 1,
      price: 330,
      imageId: 'kllwewvz',
      categoryId: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('Positions', null, {});
  }
};
