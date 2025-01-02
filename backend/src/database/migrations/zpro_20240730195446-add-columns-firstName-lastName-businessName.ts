import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableConfig = {
      tableName: 'Contacts',
      firstName: 'firstName',
      lastName: 'lastName',
      businessName: 'businessName'
    };

    const columnConfig = {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    };

    await Promise.all([
      queryInterface.addColumn(
        tableConfig.tableName,
        tableConfig.firstName,
        columnConfig
      ),
      queryInterface.addColumn(
        tableConfig.tableName,
        tableConfig.lastName,
        columnConfig
      ),
      queryInterface.addColumn(
        tableConfig.tableName,
        tableConfig.businessName,
        columnConfig
      )
    ]);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const tableConfig = {
      tableName: 'Contacts',
      firstName: 'firstName',
      lastName: 'lastName',
      businessName: 'businessName'
    };

    await Promise.all([
      queryInterface.removeColumn(tableConfig.tableName, tableConfig.firstName),
      queryInterface.removeColumn(tableConfig.tableName, tableConfig.lastName),
      queryInterface.removeColumn(tableConfig.tableName, tableConfig.businessName)
    ]);
  }
};

export default migration; 