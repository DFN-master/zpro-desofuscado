import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Whatsapps';
    
    // Adiciona coluna wppPass
    await queryInterface.addColumn(tableName, 'wppPass', {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    });

    // Adiciona coluna wppUser
    await queryInterface.addColumn(tableName, 'wppUser', {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Whatsapps';
    
    // Remove coluna wppPass
    await queryInterface.removeColumn(tableName, 'wppPass');
    
    // Remove coluna wppUser
    await queryInterface.removeColumn(tableName, 'wppUser');
  }
};

export default migration; 