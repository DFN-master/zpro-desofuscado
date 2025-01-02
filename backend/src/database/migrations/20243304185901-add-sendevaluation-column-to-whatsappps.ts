import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn('Whatsapps', 'sendEvaluation', {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: 'disabled'
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn('Whatsapps', 'sendEvaluation');
  }
};

export default migration; 