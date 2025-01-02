'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableInfo = {
      tableName: 'Tickets',
      typebotStatusColumn: 'typebotStatus',
      typebotSessionColumn: 'typebotSessionId'
    };

    // Adicionar coluna typebotStatus
    await queryInterface.addColumn(
      tableInfo.tableName,
      tableInfo.typebotStatusColumn,
      {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    );

    // Adicionar coluna typebotSessionId
    await queryInterface.addColumn(
      tableInfo.tableName,
      tableInfo.typebotSessionColumn,
      {
        type: DataTypes.STRING,
        allowNull: true
      }
    );
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const tableInfo = {
      tableName: 'Tickets',
      typebotStatusColumn: 'typebotStatus',
      typebotSessionColumn: 'typebotSessionId'
    };

    // Remover as colunas
    await queryInterface.removeColumn(tableInfo.tableName, tableInfo.typebotStatusColumn);
    await queryInterface.removeColumn(tableInfo.tableName, tableInfo.typebotSessionColumn);
  }
}; 