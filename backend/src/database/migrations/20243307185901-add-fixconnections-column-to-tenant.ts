import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Tenants';
    const columnName = 'fixConnections';
    
    return queryInterface.addColumn(tableName, columnName, {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: 'disabled'
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Tenants';
    const columnName = 'fixConnections';
    
    return queryInterface.removeColumn(tableName, columnName);
  }
};

export default migration; 