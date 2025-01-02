import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkUpdate(
        'Tenants',
        {
          acceptTerms: false
        },
        {},
        { transaction }
      );
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    throw new Error('Não é possível reverter esta migração');
  }
};

export default migration; 