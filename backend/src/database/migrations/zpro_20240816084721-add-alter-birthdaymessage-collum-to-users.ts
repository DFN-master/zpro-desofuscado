import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Whatsapps';
    const columnName = 'birthdayDateMessage';
    const errorMessage = 'Erro ao alterar a coluna "birthdayDateMessage" na tabela "Whatsapps":';

    try {
      await queryInterface.changeColumn(tableName, columnName, {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
      });
    } catch (error) {
      console.error(errorMessage, error);
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const tableName = 'Whatsapps';
    const columnName = 'birthdayDateMessage';
    const errorMessage = 'Erro ao alterar a coluna "birthdayDateMessage" na tabela "Whatsapps":';

    try {
      await queryInterface.changeColumn(tableName, columnName, {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      });
    } catch (error) {
      console.error(errorMessage, error);
    }
  }
};

export default migration; 