import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn('Whatsapps', 'chatgptPrompt', {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn('Whatsapps', 'chatgptPrompt');
  }
};

export default migration; 