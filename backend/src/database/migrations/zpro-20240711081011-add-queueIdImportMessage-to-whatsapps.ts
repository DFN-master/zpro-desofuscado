import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const config = {
      columnName: 'queueIdImportMessage',
      tableName: 'Whatsapps',
      referencedTable: 'Queues',
      onDeleteAction: 'SET NULL',
      onUpdateAction: 'CASCADE'
    };

    await queryInterface.addColumn(
      config.columnName,
      config.tableName,
      {
        type: DataTypes.INTEGER,
        references: {
          model: config.referencedTable,
          key: 'id'
        },
        defaultValue: null,
        allowNull: true,
        onDelete: config.onDeleteAction,
        onUpdate: config.onUpdateAction
      }
    );
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const config = {
      columnName: 'queueIdImportMessage',
      tableName: 'Whatsapps'
    };

    await queryInterface.removeColumn(
      config.columnName,
      config.tableName
    );
  }
};

export default migration; 