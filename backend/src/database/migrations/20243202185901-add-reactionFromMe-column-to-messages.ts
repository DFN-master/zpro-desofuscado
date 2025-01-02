import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn('Messages', 'reactionFromMe', {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('Messages', 'reactionFromMe');
  }
};

export default migration; 