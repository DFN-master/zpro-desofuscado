import { QueryInterface } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(
      'ALTER TABLE "Settings" DROP CONSTRAINT "Settings_tenantId_fkey";'
    );
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    // Se precisar reverter a migração, você pode adicionar o código aqui
    // para recriar a constraint
  }
}; 