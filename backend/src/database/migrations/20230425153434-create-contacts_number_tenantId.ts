import { QueryInterface } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const tableInfo = await queryInterface.describeTable("Contacts");

    if (!tableInfo || !tableInfo["number"] || !tableInfo["tenantId"]) {
      await queryInterface.sequelize.query(`
        CREATE UNIQUE INDEX Contacts_number_tenantId ON "Contacts" (number, "tenantId");
      `);
    }

    // Outras alterações que você precisa executar na migração, se houver
  },

  down: async (queryInterface: QueryInterface) => {
    const tableInfo = await queryInterface.describeTable("Contacts");

    if (tableInfo && tableInfo["number"] && tableInfo["tenantId"]) {
      await queryInterface.removeIndex("Contacts", "Contacts_number_tenantId");
    }

    // Outras alterações de rollback que você precisa executar na migração, se houver
  }
};

