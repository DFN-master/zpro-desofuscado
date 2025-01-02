import { QueryInterface, DataTypes } from 'sequelize';
import { SystemColors } from '../../utils/defaultConstantsZPRO';

interface MigrationInterface {
  up: (queryInterface: QueryInterface) => Promise<void>;
  down: (queryInterface: QueryInterface) => Promise<void>;
}

const migration: MigrationInterface = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Tenants';
    const columnName = 'SystemColors';

    return queryInterface.addColumn(tableName, columnName, {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: SystemColors
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Tenants';
    const columnName = 'SystemColors';

    return queryInterface.removeColumn(tableName, columnName);
  }
};

export default migration; 