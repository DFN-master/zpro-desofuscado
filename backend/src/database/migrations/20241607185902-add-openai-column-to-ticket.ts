import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      return Promise.all([
        queryInterface.addColumn(
          'Tickets',
          'threadId',
          {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null
          },
          { transaction }
        ),
        queryInterface.addColumn(
          'Tickets',
          'runId',
          {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null
          },
          { transaction }
        )
      ]);
    });
  },

  down: async (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      return Promise.all([
        queryInterface.removeColumn('Tickets', 'threadId', { transaction }),
        queryInterface.removeColumn('Tickets', 'runId', { transaction })
      ]);
    });
  }
};

export default migration; 