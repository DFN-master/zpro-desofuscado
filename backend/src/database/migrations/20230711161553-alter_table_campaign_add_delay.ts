import { QueryInterface, DataTypes } from 'sequelize';

interface MigrationInterface {
  up: (queryInterface: QueryInterface) => Promise<void>;
  down: (queryInterface: QueryInterface) => Promise<void>;
}

const migration: MigrationInterface = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Campaigns';
    const columnName = 'delay';

    return queryInterface.addColumn(tableName, columnName, {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 20
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Campaigns';
    const columnName = 'delay';

    return queryInterface.removeColumn(tableName, columnName);
  }
};

export default migration; 