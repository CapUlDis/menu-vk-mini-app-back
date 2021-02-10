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
          type: Sequelize.INTEGER,
          allowNull: false
      },
      unit: {
          type: Sequelize.STRING,
          allowNull: false
      },
      price: {
          type: Sequelize.STRING,
          allowNull: false
      },
      image: {
          type: Sequelize.BLOB,
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