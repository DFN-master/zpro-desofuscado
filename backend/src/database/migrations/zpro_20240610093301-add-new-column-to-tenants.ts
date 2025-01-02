import { QueryInterface, Sequelize } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface, Sequelize: Sequelize): Promise<void> => {
    try {
      const tableExists = await queryInterface.sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_name = 'InternalMessage';"
      );

      if (tableExists[0].length > 0) {
        await queryInterface.renameTable('InternalMessage', 'PrivateMessage');
      } else {
        console.log('Table does not exist.');
      }
    } catch (error) {
      // Tratar erro se necessário
    }
  },

  down: async (queryInterface: QueryInterface, Sequelize: Sequelize): Promise<void> => {
    try {
      const tableExists = await queryInterface.sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_name = 'PrivateMessage';"
      );

      if (tableExists[0].length > 0) {
        await queryInterface.renameTable('PrivateMessage', 'InternalMessage');
      } else {
        console.log('Table does not exist.');
      }
    } catch (error) {
      // Tratar erro se necessário
    }
  }
};

export default migration; 