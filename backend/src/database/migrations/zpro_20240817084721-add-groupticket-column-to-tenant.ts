import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn('Tenants', 'groupTickets', {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: 'disabled'
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn('Tenants', 'groupTickets');
  }
};

export default migration; 