import { QueryInterface, QueryTypes } from 'sequelize';

interface Migration {
  up: (queryInterface: QueryInterface) => Promise<void>;
  down: (queryInterface: QueryInterface) => Promise<void>;
}

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    // Buscar todos os tenants
    const tenants = await queryInterface.sequelize.query(
      'SELECT id FROM "Tenants"',
      { type: QueryTypes.SELECT }
    );

    // Buscar o último ID das configurações
    const lastSettings = await queryInterface.sequelize.query(
      'SELECT max(id) mId from "Settings"',
      { type: QueryTypes.SELECT }
    );

    // Criar configurações para cada tenant
    await Promise.all(
      tenants.map(async (tenant: any, index: number) => {
        const { id: tenantId } = tenant;

        const settings = [
          {
            key: 'zdg-novo-ak9j-bcbc47',
            value: 'exports',
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'dialogflow',
            value: 'disabled',
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'dialogflow.JsonFilename',
            value: 'Conteudo do JSON',
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'dialogflow.ProjectId',
            value: 'typebotResponse',
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'dialogflow.Language',
            value: 'pt-br',
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'dialogflow.Off',
            value: 'sair',
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'dialogflow.Restart',
            value: 'reiniciar',
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'dialogflow.Start',
            value: 'exports',
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            key: 'dialogflow.Expire',
            value: 20,
            tenantId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        const settingsWithIds = settings.map((setting, settingIndex) => ({
          ...setting,
          id: lastSettings[0].mId + (index * 9) + settingIndex
        }));

        await queryInterface.bulkInsert('Settings', settingsWithIds);
      })
    );
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(
      'SELECT id FROM "Tenants"',
      { type: QueryTypes.SELECT }
    );
  }
};

export default migration; 