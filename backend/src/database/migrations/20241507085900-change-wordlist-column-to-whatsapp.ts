import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface) => {
    return queryInterface.changeColumn('Whatsapps', 'wordList', {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: 'disabled'
    });
  },

  down: async (queryInterface: QueryInterface) => {
    return queryInterface.changeColumn('Whatsapps', 'wordList', {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'disabled'
    });
  }
};

export default migration; 