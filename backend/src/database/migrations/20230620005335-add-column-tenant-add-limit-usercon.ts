import { QueryInterface, DataTypes } from 'sequelize';

interface MigrationInterface {
  up: (queryInterface: QueryInterface) => Promise<void>;
  down: (queryInterface: QueryInterface) => Promise<void>;
}

const migration: MigrationInterface = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableInfo = {
      tableName: 'Tenants',
      maxUsersColumn: 'maxUsers',
      maxConnectionsColumn: 'maxConnections'
    };

    const tableDescription = await queryInterface.describeTable(tableInfo.tableName);

    if (!tableDescription || !tableDescription[tableInfo.maxUsersColumn]) {
      await queryInterface.addColumn(tableInfo.tableName, tableInfo.maxUsersColumn, {
        type: DataTypes.INTEGER,
        allowNull: true
      });
    }

    if (!tableDescription || !tableDescription[tableInfo.maxConnectionsColumn]) {
      await queryInterface.addColumn(tableInfo.tableName, tableInfo.maxConnectionsColumn, {
        type: DataTypes.INTEGER,
        allowNull: true
      });
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const tableInfo = {
      tableName: 'Tenants',
      maxUsersColumn: 'maxUsers',
      maxConnectionsColumn: 'maxConnections'
    };

    await queryInterface.removeColumn(tableInfo.tableName, tableInfo.maxUsersColumn);
    await queryInterface.removeColumn(tableInfo.tableName, tableInfo.maxConnectionsColumn);
  }
};

export default migration; 