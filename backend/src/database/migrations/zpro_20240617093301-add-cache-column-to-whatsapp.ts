import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Whatsapps';
    
    await queryInterface.addColumn(tableName, 'webversion', {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn(tableName, 'remotePath', {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Whatsapps';
    
    await queryInterface.removeColumn(tableName, 'webversion');
    await queryInterface.removeColumn(tableName, 'remotePath');
  }
};

export default migration; 