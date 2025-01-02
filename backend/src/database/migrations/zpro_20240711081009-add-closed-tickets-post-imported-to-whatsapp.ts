import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn('Whatsapps', 'closedTicketsPostImported', {
      type: DataTypes.BOOLEAN,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('Whatsapps', 'closedTicketsPostImported');
  }
};

export default migration; 