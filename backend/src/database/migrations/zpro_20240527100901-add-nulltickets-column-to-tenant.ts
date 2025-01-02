import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn('Tenants', 'nullTickets', {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: 'disabled'
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('Tenants', 'nullTickets');
  }
};

export default migration; 