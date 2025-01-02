import { QueryInterface } from 'sequelize';

interface Migration {
  up: (queryInterface: QueryInterface) => Promise<void>;
  down: (queryInterface: QueryInterface) => Promise<void>;
}

const migration: Migration = {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.bulkInsert('Settings', [
      {
        key: 'userCreation',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'NotViewTicketsQueue',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'call',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'callRejectMessage',
        value: 'As chamadas de voz e vídeo estão desabilitadas para esse WhatsApp, favor enviar uma mensagem de texto.',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'CheckMsgIsGroup',
        value: 'enabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'call',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'webhookUrl',
        value: 'https://webhook.site/c2444ac9-a-0664-439a-1b.json',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'typebot',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'typebotExpire',
        value: '20',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'typebotUrl',
        value: 'https://typebot.typebot.com.br',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'typebotAllTickets',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'emailUser',
        value: 'email@gmail.com',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'emailPass',
        value: '123456789',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'emailHost',
        value: 'smtp.gmail.com',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'emailPort',
        value: '465',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'emailSecurity',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'emailFrom',
        value: 'email@gmail.com',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'userRating',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'chatGPT',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'chatGPTApiKey',
        value: 'sk-By0h2865zNDI0gn4UD4JT3BlbkFJaMutPePyT',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'chatGPTPrompt',
        value: 'Atue como um vendedor',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'n8n',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'n8nAllTickets',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'n8nRenewApi',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'dialogflow',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'dialogflowLanguage',
        value: 'pt-br',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'dialogflowProjectId',
        value: 'zdg-novo-ak9j',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'dialogflowSessionId',
        value: 'zdg-novo-ak9j-bcbc479cbf-hr8mSSCO6p1a715bb1c',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'dialogflowJson',
        value: 'Conteudo do JSON',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'dialogflowAllTickets',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'webhookChannel',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'webhookCreateUser',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'webhookUpdateUser',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'webhookCreateTicket',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'webhookUpdateTicket',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'botTickets',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'botTicketsLimit',
        value: '30',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'botTicketsLimitDaysAfter',
        value: '20',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'botTicketsQueueUndefined',
        value: 'sair',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'botTicketsViewTickets',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'botTicketsModifyAllTickets',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'botTicketsNewAssignedUser',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'botTicketsChat',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'botTicketsGroupMsg',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'ignoreGroupMsg',
        value: 'enabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'DirectTicketsToWallets',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'autoClose',
        value: '86400',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'autoCloseMessage',
        value: 'Seu atendimento foi encerrado por falta de interação',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'NotViewTicketsQueue',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'OrganizationId',
        value: '55119123456789',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'smtp',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'chatgptOff',
        value: 'sair',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'chatgptEnable',
        value: 'reiniciar',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'universalCounter',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'notificationSilent',
        value: 'disabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      },
      {
        key: 'forbiddenNumbers',
        value: 'enabled',
        createdAt: '2020-12-12 16:08:45.354',
        updatedAt: '2020-12-12 16:08:45.354',
        tenantId: 1
      }
    ]);
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.bulkDelete('Settings', {});
  }
};

export default migration; 