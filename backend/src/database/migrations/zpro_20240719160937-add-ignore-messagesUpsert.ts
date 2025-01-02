import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'MessageUpserts';
    
    await Promise.all([
      queryInterface.addColumn(tableName, 'ignore', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }),
      
      queryInterface.addColumn(tableName, 'fromMe', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      })
    ]);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'MessageUpserts';
    
    await queryInterface.removeColumn(tableName, 'ignore');
    await queryInterface.removeColumn(tableName, 'fromMe');
  }
};

export default migration; 