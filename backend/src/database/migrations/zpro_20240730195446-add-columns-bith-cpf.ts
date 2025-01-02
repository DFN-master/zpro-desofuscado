import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableConfig = {
      tableName: 'Contacts',
      birthdayColumn: 'birthdayDate',
      cpfColumn: 'cpf'
    };

    const columnConfig = {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    };

    return Promise.all([
      queryInterface.addColumn(
        tableConfig.tableName,
        tableConfig.birthdayColumn,
        columnConfig
      ),
      queryInterface.addColumn(
        tableConfig.tableName,
        tableConfig.cpfColumn,
        columnConfig
      )
    ]);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const tableConfig = {
      tableName: 'Contacts',
      birthdayColumn: 'birthdayDate',
      cpfColumn: 'cpf'
    };

    return Promise.all([
      queryInterface.removeColumn(
        tableConfig.tableName,
        tableConfig.birthdayColumn
      ),
      queryInterface.removeColumn(
        tableConfig.tableName,
        tableConfig.cpfColumn
      )
    ]);
  }
};

export default migration; 