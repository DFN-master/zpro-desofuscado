import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableConfig = {
      tableName: 'Whatsapps',
      wppPassColumn: 'wppPass',
      wppUserColumn: 'wppUser'
    };

    const columnConfig = {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    };

    // Altera a coluna wppPass
    await queryInterface.changeColumn(
      tableConfig.tableName,
      tableConfig.wppPassColumn,
      columnConfig
    );

    // Altera a coluna wppUser
    await queryInterface.changeColumn(
      tableConfig.tableName,
      tableConfig.wppUserColumn,
      columnConfig
    );
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const tableConfig = {
      tableName: 'Whatsapps',
      wppPassColumn: 'wppPass',
      wppUserColumn: 'wppUser'
    };

    const columnConfig = {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    };

    // Reverte a coluna wppPass
    await queryInterface.changeColumn(
      tableConfig.tableName,
      tableConfig.wppPassColumn,
      columnConfig
    );

    // Reverte a coluna wppUser
    await queryInterface.changeColumn(
      tableConfig.tableName,
      tableConfig.wppUserColumn,
      columnConfig
    );
  }
};

export default migration; 