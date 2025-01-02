import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Tenants';
    const columnName = 'acceptTerms';

    await queryInterface.addColumn(tableName, columnName, {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Tenants';
    const columnName = 'acceptTerms';

    await queryInterface.removeColumn(tableName, columnName);
  }
};

export default migration; 