import { QueryInterface, DataTypes } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const columns = {
      chatgptPrompt: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
      },
      chatgptApiKey: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
      },
      chatgptOrganizationId: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
      },
      chatgptAssistantId: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
      },
      chatgptOffline: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
      }
    };

    await queryInterface.addColumn('Tickets', 'chatgptPrompt', columns.chatgptPrompt);
    await queryInterface.addColumn('Tickets', 'chatgptApiKey', columns.chatgptApiKey);
    await queryInterface.addColumn('Tickets', 'chatgptOrganizationId', columns.chatgptOrganizationId);
    await queryInterface.addColumn('Tickets', 'chatgptAssistantId', columns.chatgptAssistantId);
    await queryInterface.addColumn('Tickets', 'chatgptOffline', columns.chatgptOffline);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn('Tickets', 'chatgptPrompt');
    await queryInterface.removeColumn('Tickets', 'chatgptApiKey');
    await queryInterface.removeColumn('Tickets', 'chatgptOrganizationId');
    await queryInterface.removeColumn('Tickets', 'chatgptAssistantId');
    await queryInterface.removeColumn('Tickets', 'chatgptOffline');
  }
};

export default migration; 