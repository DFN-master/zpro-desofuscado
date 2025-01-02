import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn('Whatsapps', 'proxyUser', {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('Whatsapps', 'proxyPass', {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn('Whatsapps', 'proxyUser');
    await queryInterface.removeColumn('Whatsapps', 'proxyPass');
  }
};

export default migration; 