import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface) => {
    const columnDefinition = {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    };

    const columns = {
      dialogflowProjectId: 'dialogflowProjectId',
      dialogflowJsonFilename: 'dialogflowJsonFilename',
      dialogflowLanguage: 'dialogflowLanguage',
      chatgptApiKey: 'chatgptApiKey',
      chatgptOrganizationId: 'chatgptOrganizationId',
      chatgptOff: 'chatgptOff'
    };

    await queryInterface.addColumn('Whatsapps', columns.dialogflowProjectId, columnDefinition);
    await queryInterface.addColumn('Whatsapps', columns.dialogflowJsonFilename, columnDefinition);
    await queryInterface.addColumn('Whatsapps', columns.dialogflowLanguage, columnDefinition);
    await queryInterface.addColumn('Whatsapps', columns.chatgptApiKey, columnDefinition);
    await queryInterface.addColumn('Whatsapps', columns.chatgptOrganizationId, columnDefinition);
    await queryInterface.addColumn('Whatsapps', columns.chatgptOff, columnDefinition);
  },

  down: async (queryInterface: QueryInterface) => {
    const columns = [
      'dialogflowProjectId',
      'dialogflowJsonFilename', 
      'dialogflowLanguage',
      'chatgptApiKey',
      'chatgptOrganizationId',
      'chatgptOff'
    ];

    for (const column of columns) {
      await queryInterface.removeColumn('Whatsapps', column);
    }
  }
};

export default migration; 