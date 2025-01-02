import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn('Tickets', 'outOpenHoursTries', {
      type: DataTypes.INTEGER,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn('Tickets', 'outOpenHoursTries');
  }
};

export default migration; 