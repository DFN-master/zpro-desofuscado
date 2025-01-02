import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface) => {
    const tableName = 'Whatsapps';
    const columnName = 'importMessages';

    await queryInterface.addColumn(tableName, columnName, {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    });
  },

  down: async (queryInterface: QueryInterface) => {
    const tableName = 'Whatsapps';
    const columnName = 'importMessages';

    await queryInterface.removeColumn(tableName, columnName);
  }
};

export default migration; 