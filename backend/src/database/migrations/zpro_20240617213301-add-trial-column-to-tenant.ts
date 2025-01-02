import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn('Tenants', 'trial', {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('Tenants', 'trialPeriod', {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn('Tenants', 'trial');
    await queryInterface.removeColumn('Tenants', 'trialPeriod');
  }
};

export default migration; 