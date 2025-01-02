import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const columns = [
      'difyType',
      'difyKey', 
      'difyUrl',
      'difyOff',
      'difyRestart'
    ];

    for (const column of columns) {
      await queryInterface.addColumn('Whatsapps', column, {
        type: DataTypes.STRING,
        allowNull: true
      });
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const columns = [
      'difyType',
      'difyKey',
      'difyUrl', 
      'difyOff',
      'difyRestart'
    ];

    for (const column of columns) {
      await queryInterface.removeColumn('Whatsapps', column);
    }
  }
};

export default migration; 