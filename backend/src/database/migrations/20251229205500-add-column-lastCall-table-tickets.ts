import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn('Tickets', 'lastCall', {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn('Tickets', 'lastCall');
  }
};

export default migration; 