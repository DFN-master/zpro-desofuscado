import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface) => {
    return queryInterface.addColumn('Whatsapps', 'wabaId', {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    });
  },

  down: async (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn('Whatsapps', 'wabaId');
  }
};

export default migration; 