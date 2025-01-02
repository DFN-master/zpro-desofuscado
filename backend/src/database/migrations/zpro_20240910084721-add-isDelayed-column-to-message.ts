import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn('Messages', 'isDelayed', {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: null
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn('Messages', 'isDelayed');
  }
};

export default migration; 