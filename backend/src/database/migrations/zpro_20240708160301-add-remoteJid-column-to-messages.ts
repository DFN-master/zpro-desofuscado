import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Messages';
    const columnName = 'remoteJid';

    await queryInterface.addColumn(tableName, columnName, {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: ''
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Messages';
    const columnName = 'remoteJid';

    await queryInterface.removeColumn(tableName, columnName);
  }
};

export default migration; 