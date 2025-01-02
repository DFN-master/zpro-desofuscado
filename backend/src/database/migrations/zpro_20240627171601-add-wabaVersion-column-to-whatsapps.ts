import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface) => {
    const tableName = 'Whatsapps';
    const columnName = 'wabaVersion';

    await queryInterface.addColumn(tableName, columnName, {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    });
  },

  down: async (queryInterface: QueryInterface) => {
    const tableName = 'Whatsapps';
    const columnName = 'wabaVersion';

    await queryInterface.removeColumn(tableName, columnName);
  }
};

export default migration; 