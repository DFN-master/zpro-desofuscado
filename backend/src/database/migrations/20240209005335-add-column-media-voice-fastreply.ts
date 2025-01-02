import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface) => {
    const tableName = 'FastReply';
    
    return queryInterface.sequelize.transaction(async (transaction) => {
      const columnConfig = {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
      };

      const transactionOptions = { transaction };

      return Promise.all([
        queryInterface.addColumn(
          tableName,
          'media',
          columnConfig,
          transactionOptions
        ),
        queryInterface.addColumn(
          tableName,
          'voice',
          columnConfig,
          transactionOptions
        )
      ]);
    });
  },

  down: async (queryInterface: QueryInterface) => {
    const tableName = 'FastReply';

    return queryInterface.sequelize.transaction(async (transaction) => {
      const transactionOptions = { transaction };

      return Promise.all([
        queryInterface.removeColumn(tableName, 'media', transactionOptions),
        queryInterface.removeColumn(tableName, 'voice', transactionOptions)
      ]);
    });
  }
};

export default migration; 