import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const TABLE_NAME = 'Tenants';
    const COLUMN_NAME = 'updateNames';
    
    await queryInterface.addColumn(TABLE_NAME, COLUMN_NAME, {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: 'disabled'
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const TABLE_NAME = 'Tenants';
    const COLUMN_NAME = 'updateNames';
    
    await queryInterface.removeColumn(TABLE_NAME, COLUMN_NAME);
  }
};

export default migration; 