import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn('Tickets', 'chatflowTransfer', {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn('Tickets', 'chatflowTransfer');
  }
};

export default migration; 