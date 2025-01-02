import { QueryInterface, DataTypes } from 'sequelize';
import { Ratings } from '../../util/defaultConstantsZPRO';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const TABLE_NAME = 'Tenants';
    const COLUMN_NAME = 'rating';

    await queryInterface.addColumn(TABLE_NAME, COLUMN_NAME, {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: Ratings
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const TABLE_NAME = 'Tenants';
    const COLUMN_NAME = 'rating';

    await queryInterface.removeColumn(TABLE_NAME, COLUMN_NAME);
  }
};

export default migration; 