import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Whatsapps';
    const columnName = 'importRecentMessages';

    await queryInterface.addColumn(tableName, columnName, {
      type: DataTypes.TEXT
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Whatsapps';
    const columnName = 'importRecentMessages';

    await queryInterface.removeColumn(tableName, columnName);
  }
};

export default migration; 