import { QueryInterface, Sequelize } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface, Sequelize: Sequelize): Promise<void> => {
    try {
      const tables = await queryInterface.sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_name = 'Groups';"
      );

      if (tables[0].length > 0) {
        await queryInterface.renameTable('Groups', 'GroupMessages');
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
        "SELECT table_name FROM information_schema.tables WHERE table_name = 'GroupMessages';"
      );

      if (tables[0].length > 0) {
        await queryInterface.renameTable('GroupMessages', 'Groups');
      } else {
        console.log('Table does not exist.');
      }
    } catch (error) {
      // Tratar erro se necessário
    }
  }
};

export default migration; 