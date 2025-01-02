import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Tickets';
    const columnName = 'lastMessageReceived';

    await queryInterface.addColumn(tableName, columnName, {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: null
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Tickets';
    const columnName = 'lastMessageReceived';

    await queryInterface.removeColumn(tableName, columnName);
  }
};

export default migration; 