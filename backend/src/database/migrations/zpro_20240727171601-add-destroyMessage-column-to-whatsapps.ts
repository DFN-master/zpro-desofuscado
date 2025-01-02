import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Whatsapps';
    const columnName = 'destroyMessage';
    const defaultValue = 'disabled';

    await queryInterface.addColumn(tableName, columnName, {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Whatsapps';
    const columnName = 'destroyMessage';

    await queryInterface.removeColumn(tableName, columnName);
  }
};

export default migration; 