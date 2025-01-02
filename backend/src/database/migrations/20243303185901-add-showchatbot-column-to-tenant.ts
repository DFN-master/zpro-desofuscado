import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn('Tenants', 'showChatBot', {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: 'disabled'
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn('Tenants', 'showChatBot');
  }
};

export default migration; 