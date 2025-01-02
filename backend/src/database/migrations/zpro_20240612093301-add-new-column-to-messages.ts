import { QueryInterface, Sequelize } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface, Sequelize: Sequelize): Promise<void> => {
    try {
      const tables = await queryInterface.sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_name = 'ReadMessageGroups';"
      );

      if (tables[0].length > 0) {
        await queryInterface.renameTable('ReadMessageGroups', 'ReadPrivateMessageGroups');
      } else {
        console.log('Table does not exist.');
      }
    } catch (error) {
      // Tratar erro se necessário
    }
  },

  down: async (queryInterface: QueryInterface, Sequelize: Sequelize): Promise<void> => {
    try {
      const tables = await queryInterface.sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_name = 'ReadPrivateMessageGroups';"
      );

      if (tables[0].length > 0) {
        await queryInterface.renameTable('ReadPrivateMessageGroups', 'ReadMessageGroups');
      } else {
        console.log('Table does not exist.');
      }
    } catch (error) {
      // Tratar erro se necessário
    }
  }
};

export default migration; 