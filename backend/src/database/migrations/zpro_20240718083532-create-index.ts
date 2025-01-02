import { QueryInterface } from 'sequelize';

interface Migration {
  up: (queryInterface: QueryInterface) => Promise<void>;
  down: (queryInterface: QueryInterface) => Promise<void>;
}

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    // Definição dos nomes das tabelas
    const tables = {
      Messages: 'Messages',
      Contacts: 'Contacts',
      Messages_tenant: 'Messages',
      Queues: 'Queues',
      ContactTag: 'ContactTag',
      Tickets: 'Tickets'
    };

    // Definição dos índices
    const indices = {
      // Messages
      idx_messages_tenant_id: 'idx_messages_tenant_id',
      idx_messages_contact_id: 'idx_messages_contact_id',
      idx_messages_ticket_id: 'idx_messages_ticket_id',
      
      // Contacts
      idx_contacts_tenant_id: 'idx_contacts_tenant_id',
      idx_contacts_number: 'idx_contacts_number',
      idx_contacts_whatsapp_id: 'idx_contacts_whatsapp_id',
      idx_contacts_status: 'idx_contacts_status',
      idx_contacts_user_id: 'idx_contacts_user_id',
      
      // Tickets
      idx_tickets_tenant_id: 'idx_tickets_tenant_id',
      idx_tickets_contact_id: 'idx_tickets_contact_id',
      idx_tickets_status: 'idx_tickets_status',
      idx_tickets_queue_id: 'idx_tickets_queue_id',
      idx_tickets_user_id: 'idx_tickets_user_id',
      
      // Queues
      idx_queues_tenant_id: 'idx_queues_tenant_id',
      
      // ContactTag
      idx_contactTag_tag_id: 'idx_contactTag_tag_id',
      idx_contactTag_contact_id: 'idx_contactTag_contact_id'
    };

    // Colunas para os índices
    const columns = {
      tenantId: 'tenantId',
      contactId: 'contactId',
      ticketId: 'ticketId',
      number: 'number', 
      whatsappId: 'whatsappId',
      status: 'status',
      userId: 'userId',
      queueId: 'queueId',
      tagId: 'tagId'
    };

    // Criação dos índices
    const currentIndices = await queryInterface.showIndex(tables.Messages);

    // Messages
    if (!currentIndices.some(index => index.name === indices.idx_messages_tenant_id)) {
      await queryInterface.addIndex(tables.Messages, [columns.tenantId], { 
        name: indices.idx_messages_tenant_id 
      });
    }

    // Contacts
    if (!currentIndices.some(index => index.name === indices.idx_contacts_tenant_id)) {
      await queryInterface.addIndex(tables.Contacts, [columns.tenantId], {
        name: indices.idx_contacts_tenant_id
      });
    }

    // Tickets 
    if (!currentIndices.some(index => index.name === indices.idx_tickets_tenant_id)) {
      await queryInterface.addIndex(tables.Tickets, [columns.tenantId], {
        name: indices.idx_tickets_tenant_id
      });
    }

    // Queues
    if (!currentIndices.some(index => index.name === indices.idx_queues_tenant_id)) {
      await queryInterface.addIndex(tables.Queues, [columns.tenantId], {
        name: indices.idx_queues_tenant_id
      });
    }

    // ContactTag
    if (!currentIndices.some(index => index.name === indices.idx_contactTag_tag_id)) {
      await queryInterface.addIndex(tables.ContactTag, [columns.tagId], {
        name: indices.idx_contactTag_tag_id
      });
    }

    // Adicione os demais índices seguindo o mesmo padrão...
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    // Remove todos os índices criados
    const indices = [
      'idx_messages_tenant_id',
      'idx_messages_contact_id', 
      'idx_messages_ticket_id',
      'idx_contacts_tenant_id',
      'idx_contacts_number',
      'idx_contacts_whatsapp_id',
      'idx_contacts_status',
      'idx_contacts_user_id',
      'idx_tickets_tenant_id',
      'idx_tickets_contact_id',
      'idx_tickets_status',
      'idx_tickets_queue_id',
      'idx_tickets_user_id',
      'idx_queues_tenant_id',
      'idx_contactTag_tag_id',
      'idx_contactTag_contact_id'
    ];

    const tables = [
      'Messages',
      'Contacts', 
      'Tickets',
      'Queues',
      'ContactTag'
    ];

    // Remove cada índice de sua respectiva tabela
    for (const table of tables) {
      for (const index of indices) {
        await queryInterface.removeIndex(table, index);
      }
    }
  }
};

export default migration; 