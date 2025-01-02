import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface) => {
    const tableName = 'Whatsapps';
    const columnName = 'statusImportMessages';

    await queryInterface.addColumn(tableName, columnName, {
      type: DataTypes.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    const tableName = 'Whatsapps';
    const columnName = 'statusImportMessages';

    await queryInterface.removeColumn(tableName, columnName);
  }
};

export default migration; 