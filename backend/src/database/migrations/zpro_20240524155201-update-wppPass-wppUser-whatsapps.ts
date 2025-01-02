import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableDef = {
      tableName: 'Whatsapps',
      wppPassCol: 'wppPass',
      wppUserCol: 'wppUser'
    };

    // Alterar coluna wppPass
    await queryInterface.changeColumn(
      tableDef.tableName,
      tableDef.wppPassCol,
      {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
      }
    );

    // Alterar coluna wppUser 
    await queryInterface.changeColumn(
      tableDef.tableName,
      tableDef.wppUserCol,
      {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
      }
    );

    // Atualizar valores existentes
    await queryInterface.bulkUpdate(
      tableDef.tableName,
      { wppPass: null },
      { wppPass: '' }
    );

    await queryInterface.bulkUpdate(
      tableDef.tableName,
      { wppUser: null },
      { wppUser: '' }
    );
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const tableDef = {
      tableName: 'Whatsapps', 
      wppPassCol: 'wppPass',
      wppUserCol: 'wppUser'
    };

    // Reverter coluna wppPass
    await queryInterface.changeColumn(
      tableDef.tableName,
      tableDef.wppPassCol,
      {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ''
      }
    );

    // Reverter coluna wppUser
    await queryInterface.changeColumn(
      tableDef.tableName,
      tableDef.wppUserCol,
      {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: ''
      }
    );
  }
};

export default migration; 