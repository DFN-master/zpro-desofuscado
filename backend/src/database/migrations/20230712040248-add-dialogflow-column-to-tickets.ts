import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableName = 'Tickets';
    const columnName = 'dialogflowStatus';

    await queryInterface.addColumn(tableName, columnName, {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  },

  down: async (queryInterface: QueryInterface) => {
    const tableName = 'Tickets';
    const columnName = 'dialogflowStatus';

    await queryInterface.removeColumn(tableName, columnName);
  }
}; 