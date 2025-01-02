import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableInfo = {
      tableName: 'Tenants',
      asaasToken: 'asaas',
      asaasCustomerId: 'asaasCustomerId',
      asaas: 'asaas'
    };

    const table = await queryInterface.describeTable(tableInfo.tableName);

    if (!table || !table[tableInfo.asaasToken]) {
      await queryInterface.addColumn(tableInfo.tableName, tableInfo.asaasToken, {
        type: DataTypes.TEXT,
        allowNull: true
      });
    }

    if (!table || !table[tableInfo.asaasCustomerId]) {
      await queryInterface.addColumn(tableInfo.tableName, tableInfo.asaasCustomerId, {
        type: DataTypes.TEXT,
        allowNull: true
      });
    }

    if (!table || !table[tableInfo.asaas]) {
      await queryInterface.addColumn(tableInfo.tableName, tableInfo.asaas, {
        type: DataTypes.TEXT,
        allowNull: true
      });
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const tableInfo = {
      tableName: 'Tenants',
      asaasToken: 'asaas',
      asaasCustomerId: 'asaasCustomerId',
      asaas: 'asaas'
    };

    await queryInterface.removeColumn(tableInfo.tableName, tableInfo.asaasToken);
    await queryInterface.removeColumn(tableInfo.tableName, tableInfo.asaasCustomerId);
    await queryInterface.removeColumn(tableInfo.tableName, tableInfo.asaas);
  }
};

export default migration; 