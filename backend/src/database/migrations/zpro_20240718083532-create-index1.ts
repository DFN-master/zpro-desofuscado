import { QueryInterface } from "sequelize";
import { Migration } from "../types/Migration";

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const tableInfo = {
      tableName: "Tickets",
      columnStatus: "status",
      columnTenantId: "tenantId",
      indexName: "idx_tickets_tenantid_status"
    };

    const indexes = await queryInterface.showIndex(tableInfo.tableName);
    
    const indexExists = indexes.some(
      (index) => index.name === tableInfo.indexName
    );

    if (!indexExists) {
      await queryInterface.addIndex(tableInfo.tableName, 
        [tableInfo.columnStatus, tableInfo.columnTenantId], 
        { name: tableInfo.indexName }
      );
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const tableInfo = {
      tableName: "Tickets",
      indexName: "idx_tickets_tenantid_status"
    };

    await queryInterface.removeIndex(
      tableInfo.tableName,
      tableInfo.indexName
    );
  }
};

export default migration; 