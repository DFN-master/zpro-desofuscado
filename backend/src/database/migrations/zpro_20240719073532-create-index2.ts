import { QueryInterface } from 'sequelize';

interface Migration {
  up: (queryInterface: QueryInterface) => Promise<void>;
  down: (queryInterface: QueryInterface) => Promise<void>;
}

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    const indexNames = {
      TICKETS_TABLE: 'Tickets',
      TENANT_ID: 'tenantId',
      TICKETS_TENANT_ID_IDX: 'tickets_tenant_id_idx',
      MESSAGES_TABLE: 'Messages',
      MESSAGES_TENANT_ID_IDX: 'messages_fromme_del_tenant_id_idx',
      CONTACT_CUSTOM_FIELDS: 'ContactCustomFields',
      CUSTOM_FIELDS_TENANT_ID_IDX: 'customfields_tenant_id_idx',
      CONTACT_TAGS: 'ContactTags',
      CONTACT_ID: 'contactId',
      STATUS: 'status',
      CONTACT_TAGS_IDX: 'contacttags_contactid_tenant_status_idx',
      CONTACT_WALLETS: 'ContactWallets',
      WHATSAPP_ID: 'whatsappId',
      WALLETS_CONTACT_ID_IDX: 'contactwallets_contactid_idx',
      WALLETS_WHATSAPP_ID_IDX: 'contactwallets_contactid_wha_id_idx',
      USERS_QUEUES: 'UsersQueues',
      USER_ID: 'userId',
      QUEUE_ID: 'queueId',
      IS_DELETED: 'isDeleted',
      SCHEDULE_DATE: 'scheduleDate',
      USERS_QUEUES_IDX: 'usersqueues_user_queue_sched_idx'
    };

    // Adicionar índices para cada tabela
    const ticketsIndices = await queryInterface.showIndex(indexNames.TICKETS_TABLE);
    if (!ticketsIndices.some(index => index.name === indexNames.TICKETS_TENANT_ID_IDX)) {
      await queryInterface.addIndex(indexNames.TICKETS_TABLE, [indexNames.TENANT_ID], {
        name: indexNames.TICKETS_TENANT_ID_IDX
      });
    }

    const messagesIndices = await queryInterface.showIndex(indexNames.MESSAGES_TABLE);
    if (!messagesIndices.some(index => index.name === indexNames.MESSAGES_TENANT_ID_IDX)) {
      await queryInterface.addIndex(indexNames.MESSAGES_TABLE, [indexNames.TENANT_ID], {
        name: indexNames.MESSAGES_TENANT_ID_IDX
      });
    }

    const customFieldsIndices = await queryInterface.showIndex(indexNames.CONTACT_CUSTOM_FIELDS);
    if (!customFieldsIndices.some(index => index.name === indexNames.CUSTOM_FIELDS_TENANT_ID_IDX)) {
      await queryInterface.addIndex(indexNames.CONTACT_CUSTOM_FIELDS, [indexNames.TENANT_ID], {
        name: indexNames.CUSTOM_FIELDS_TENANT_ID_IDX
      });
    }

    const contactTagsIndices = await queryInterface.showIndex(indexNames.CONTACT_TAGS);
    if (!contactTagsIndices.some(index => index.name === indexNames.CONTACT_TAGS_IDX)) {
      await queryInterface.addIndex(indexNames.CONTACT_TAGS, [
        indexNames.CONTACT_ID,
        indexNames.TENANT_ID,
        indexNames.STATUS
      ], {
        name: indexNames.CONTACT_TAGS_IDX
      });
    }

    const walletsIndices = await queryInterface.showIndex(indexNames.CONTACT_WALLETS);
    if (!walletsIndices.some(index => index.name === indexNames.WALLETS_CONTACT_ID_IDX)) {
      await queryInterface.addIndex(indexNames.CONTACT_WALLETS, [indexNames.CONTACT_ID], {
        name: indexNames.WALLETS_CONTACT_ID_IDX
      });
    }

    if (!walletsIndices.some(index => index.name === indexNames.WALLETS_WHATSAPP_ID_IDX)) {
      await queryInterface.addIndex(indexNames.CONTACT_WALLETS, [
        indexNames.CONTACT_ID,
        indexNames.WHATSAPP_ID
      ], {
        name: indexNames.WALLETS_WHATSAPP_ID_IDX
      });
    }

    const usersQueuesIndices = await queryInterface.showIndex(indexNames.USERS_QUEUES);
    if (!usersQueuesIndices.some(index => index.name === indexNames.USERS_QUEUES_IDX)) {
      await queryInterface.addIndex(indexNames.USERS_QUEUES, [
        indexNames.USER_ID,
        indexNames.QUEUE_ID,
        indexNames.IS_DELETED,
        indexNames.TENANT_ID,
        indexNames.SCHEDULE_DATE
      ], {
        name: indexNames.USERS_QUEUES_IDX
      });
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    const indexNames = {
      TICKETS_TABLE: 'Tickets',
      MESSAGES_TABLE: 'Messages',
      CONTACT_CUSTOM_FIELDS: 'ContactCustomFields',
      CONTACT_TAGS: 'ContactTags',
      CONTACT_WALLETS: 'ContactWallets',
      USERS_QUEUES: 'UsersQueues',
      TICKETS_TENANT_ID_IDX: 'tickets_tenant_id_idx',
      MESSAGES_TENANT_ID_IDX: 'messages_fromme_del_tenant_id_idx',
      CUSTOM_FIELDS_TENANT_ID_IDX: 'customfields_tenant_id_idx',
      CONTACT_TAGS_IDX: 'contacttags_contactid_tenant_status_idx',
      WALLETS_CONTACT_ID_IDX: 'contactwallets_contactid_idx',
      WALLETS_WHATSAPP_ID_IDX: 'contactwallets_contactid_wha_id_idx',
      USERS_QUEUES_IDX: 'usersqueues_user_queue_sched_idx'
    };

    // Remover todos os índices
    await queryInterface.removeIndex(indexNames.TICKETS_TABLE, indexNames.TICKETS_TENANT_ID_IDX);
    await queryInterface.removeIndex(indexNames.MESSAGES_TABLE, indexNames.MESSAGES_TENANT_ID_IDX);
    await queryInterface.removeIndex(indexNames.CONTACT_CUSTOM_FIELDS, indexNames.CUSTOM_FIELDS_TENANT_ID_IDX);
    await queryInterface.removeIndex(indexNames.CONTACT_TAGS, indexNames.CONTACT_TAGS_IDX);
    await queryInterface.removeIndex(indexNames.CONTACT_WALLETS, indexNames.WALLETS_CONTACT_ID_IDX);
    await queryInterface.removeIndex(indexNames.CONTACT_WALLETS, indexNames.WALLETS_WHATSAPP_ID_IDX);
    await queryInterface.removeIndex(indexNames.USERS_QUEUES, indexNames.USERS_QUEUES_IDX);
  }
};

export default migration; 