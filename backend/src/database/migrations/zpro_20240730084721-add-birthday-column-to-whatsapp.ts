import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Whatsapps';
    const birthdayDateColumn = 'birthdayDate';
    const birthdayMessageColumn = 'birthdayMessage';

    // Adiciona coluna birthdayDate
    await queryInterface.addColumn(tableName, birthdayDateColumn, {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'disabled'
    });

    // Adiciona coluna birthdayMessage
    await queryInterface.addColumn(tableName, birthdayMessageColumn, {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Whatsapps';
    const birthdayDateColumn = 'birthdayDate';
    const birthdayMessageColumn = 'birthdayMessage';

    // Remove as colunas
    await queryInterface.removeColumn(tableName, birthdayDateColumn);
    await queryInterface.removeColumn(tableName, birthdayMessageColumn);
  }
};

export default migration; 