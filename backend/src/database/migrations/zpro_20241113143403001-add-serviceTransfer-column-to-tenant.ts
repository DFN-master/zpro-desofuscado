import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn('Tenants', 'serviceTransfer', {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: 'enabled'
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn('Tenants', 'serviceTransfer');
  }
};

export default migration; 