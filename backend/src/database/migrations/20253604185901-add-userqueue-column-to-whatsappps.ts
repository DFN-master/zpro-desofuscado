import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Whatsapps';
    
    await queryInterface.addColumn(tableName, 'queueId', {
      type: DataTypes.INTEGER,
      allowNull: true
    });

    await queryInterface.addColumn(tableName, 'userId', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Whatsapps';
    
    await queryInterface.removeColumn(tableName, 'queueId');
    await queryInterface.removeColumn(tableName, 'userId');
  }
};

export default migration; 