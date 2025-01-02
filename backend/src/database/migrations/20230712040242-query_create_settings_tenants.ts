import { QueryInterface, QueryTypes, Sequelize } from 'sequelize';

interface Migration {
  up: (queryInterface: QueryInterface) => Promise<void>;
  down: (queryInterface: QueryInterface) => Promise<void>;
}

const migration: Migration = {
  up: async (queryInterface: QueryInterface) => {
    const tenantsQuery = `SELECT id FROM "Tenants"`;
    const maxSettingsQuery = `SELECT max(id) mId from "Settings"`;

    const tenants = await queryInterface.sequelize.query(tenantsQuery, {
      type: QueryTypes.SELECT
    });

    const maxSettings = await queryInterface.sequelize.query(maxSettingsQuery, {
      type: QueryTypes.SELECT
    });

    await Promise.all(
      tenants.map(async (tenant: any, index: number) => {
        const { id: tenantId } = tenant;

        const defaultSettings = [
          {
            key: 'typebotName',
            value: 'disabled',
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'Settings',
            value: 'disabled',
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'callRejectMessage',
            value: 'As chamadas de voz e vídeo estão desabilitas para esse WhatsApp, favor enviar uma mensagem de texto.',
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'rejectCall',
            value: 'disabled',
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'typebotUrl',
            value: 'https://typebot.typebot.com.br/api/v1/sendMessage',
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'typebot',
            value: 'disabled',
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'webhook',
            value: 'https://webhook.site/c2444aca-0664-4397-a10d-c3f1a715bb1c',
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'typebotName',
            value: 'zdg',
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'typebotExpire',
            value: 'Message',
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'typebotOff',
            value: 20,
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        const settingsWithIds = defaultSettings.map((setting, settingIndex) => ({
          ...setting,
          id: maxSettings[0].mId + index * 10 + settingIndex
        }));

        await queryInterface.bulkInsert('Settings', settingsWithIds);
      })
    );
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`SELECT id FROM "Settings"`, {
      type: QueryTypes.SELECT
    });
  }
};

export default migration; 