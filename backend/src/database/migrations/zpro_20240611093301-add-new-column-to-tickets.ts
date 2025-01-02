import { QueryInterface, Sequelize } from 'sequelize';
import { Migration } from '../types/Migration';

const migration: Migration = {
  up: async (queryInterface: QueryInterface, Sequelize: Sequelize): Promise<void> => {
    try {
      const result = await queryInterface.sequelize.query(
        `SELECT table_name FROM information_schema.tables WHERE table_name = 'UsersPrivateGroups';`
      );

      if (result[0].length > 0) {
        await queryInterface.renameTable('UsersGroups', 'UsersPrivateGroups');
      } else {
        console.log('Table does not exist.');
      }
    } catch (error) {
      // Tratamento de erro silencioso mantido conforme original
    }
  },

  down: async (queryInterface: QueryInterface, Sequelize: Sequelize): Promise<void> => {
    try {
      const result = await queryInterface.sequelize.query(
        `SELECT table_name FROM information_schema.tables WHERE table_name = 'UsersPrivateGroups';`
      );

      if (result[0].length > 0) {
        await queryInterface.renameTable('UsersPrivateGroups', 'UsersGroups');
      } else {
        console.log('Table does not exist.');
      }
    } catch (error) {
      // Tratamento de erro silencioso mantido conforme original
    }
  }
};

export default migration; 