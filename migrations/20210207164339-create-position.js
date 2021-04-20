module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Positions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
          type: Sequelize.STRING,
          allowNull: false
      },
      value: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      unitId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      price: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      imageId: {
        type: Sequelize.STRING,
      },
      categoryId: {
        type: Sequelize.INTEGER,
        reference: {
          model: 'Category',
          key: 'id',
          as: 'categoryId'
        },
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Positions');
  }
};