import { QueryInterface } from 'sequelize';

interface Migration {
  up: (queryInterface: QueryInterface) => Promise<void>;
  down: (queryInterface: QueryInterface) => Promise<void>;
}

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(`
      INSERT INTO public."Users" (
        "id",
        "name",
        "email",
        "passwordHash",
        "profile",
        "tokenVersion",
        "tenantId",
        "queuesIds",
        "status",
        "configs",
        "lastOnline",
        "lastLogout",
        "isOnline",
        "createdAt",
        "updatedAt"
      ) VALUES (
        1,
        'Administrador',
        'admin@zpro.io',
        '$2a$08$/wEAiCcMCOIbjcpRlXkMeyLkfGcnzxCQprgYeFryP7WTPY/EQ/ON32',
        'admin',
        0,
        1,
        '[]',
        'offline',
        '{
          "filtrosAtendimento": {
            "searchParam": "",
            "pageNumber": 1,
            "status": ["open"],
            "showAll": true,
            "count": null,
            "queuesIds": [],
            "withUnreadMessages": false,
            "isNotAssignedUser": false,
            "includeNotPending": true
          },
          "isDark": false
        }',
        '2020-11-07 00:04:21.032',
        '2022-11-04 17:14:32.711',
        true,
        '2022-08-04 17:28:29.860',
        '2022-11-04 17:14:32.711'
      )
      ON CONFLICT (id) DO NOTHING;
    `);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.bulkDelete('Users', {});
  }
};

export default migration; 