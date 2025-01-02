import { QueryInterface } from "sequelize";

interface Migration {
  up: (queryInterface: QueryInterface) => Promise<void>;
  down: (queryInterface: QueryInterface) => Promise<void>;
}

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    // Adiciona índices para melhorar performance das consultas
    
    // Índice para Users
    await queryInterface.addIndex("Users", ["id"], {
      name: "idx_users_id"
    });

    // Índice composto para Tickets
    await queryInterface.addIndex("Tickets", [
      "tenantId",
      "status",
      "queueId",
      "isGroup",
      "unread",
      "whatsappId"
    ], {
      name: "idx_tickets_tenant_status"
    });

    // Índice para status de tickets
    await queryInterface.addIndex("Tickets", [
      "userId",
      "contactId"
    ], {
      name: "idx_tickets_tenant_combined"
    });

    // Índice para tickets por tenant
    await queryInterface.addIndex("Tickets", [
      "tenantId",
      "status"
    ], {
      name: "idx_tickets_tenant"
    });

    // Índice para Users por tenant
    await queryInterface.addIndex("Users", ["tenantId"], {
      name: "idx_users_tenant"
    });

    // Índice composto para ContactWallets
    await queryInterface.addIndex("ContactWallets", [
      "walletId", 
      "unread"
    ], {
      name: "idx_contactwallets_wallet_contacts_isgroup_unreadMessages"
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    // Remove os índices criados
    await queryInterface.removeIndex("Users", "idx_users_tenant");
    await queryInterface.removeIndex("Tickets", "idx_tickets_tenant");
    await queryInterface.removeIndex("Users", "idx_users_id");
    await queryInterface.removeIndex("ContactWallets", "idx_contactwallets_wallet_contacts_isgroup_unreadMessages");
    await queryInterface.removeIndex("Tickets", "idx_tickets_tenant_combined");
    await queryInterface.removeIndex("Tickets", "idx_tickets_tenant_status");
  }
};

export default migration; 