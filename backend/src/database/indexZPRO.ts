import { Sequelize } from 'sequelize-typescript';
import { Logger } from '../utils/logger';
import * as cron from 'node-cron';
import dbConfig from '../config/database';

// Models
import UserZPRO from '../models/UserZPRO';
import SettingZPRO from '../models/SettingZPRO';
import ContactZPRO from '../models/ContactZPRO';
import TicketZPRO from '../models/TicketZPRO';
import WhatsappZPRO from '../models/WhatsappZPRO';
import ContactCustomFieldZPRO from '../models/ContactCustomFieldZPRO';
import MessageZPRO from '../models/MessageZPRO';
import MessageOffLineZPRO from '../models/MessageOffLineZPRO';
import AutoReplyZPRO from '../models/AutoReplyZPRO';
import StepsReplyZPRO from '../models/StepsReplyZPRO';
import StepsReplyActionZPRO from '../models/StepsReplyActionZPRO';
import QueueZPRO from '../models/QueueZPRO';
import UsersQueuesZPRO from '../models/UsersQueuesZPRO';
import TenantZPRO from '../models/TenantZPRO';
import AutoReplyLogsZPRO from '../models/AutoReplyLogsZPRO';
import UserMessagesLogZPRO from '../models/UserMessagesLogZPRO';
import FastReplyZPRO from '../models/FastReplyZPRO';
import TagZPRO from '../models/TagZPRO';
import ContactWalletZPRO from '../models/ContactWalletZPRO';
import ContactTagZPRO from '../models/ContactTagZPRO';
import CampaignZPRO from '../models/CampaignZPRO';
import CampaignContactsZPRO from '../models/CampaignContactsZPRO';
import ApiConfigZPRO from '../models/ApiConfigZPRO';
import ApiMessageZPRO from '../models/ApiMessageZPRO';
import LogTicketZPRO from '../models/LogTicketZPRO';
import ChatFlowZPRO from '../models/ChatFlowZPRO';
import KanbanZPRO from '../models/KanbanZPRO';
import TicketProtocolZPRO from '../models/TicketProtocolZPRO';
import TicketEvaluationZPRO from '../models/TicketEvaluationZPRO';
import PrivateMessageZPRO from '../models/PrivateMessageZPRO';
import GroupMessagesZPRO from '../models/GroupMessagesZPRO';
import UsersPrivateGroupsZPRO from '../models/UsersPrivateGroupsZPRO';
import ReadPrivateMessageGroupsZPRO from '../models/ReadPrivateMessageGroupsZPRO';
import TodoListZPRO from '../models/TodoListZPRO';
import TicketNotes from '../models/TicketNotes';
import GhostListZPRO from '../models/GhostListZPRO';
import WordListZPRO from '../models/WordListZPRO';
import ParticipantsListZPRO from '../models/ParticipantsListZPRO';
import GroupLinkListZPRO from '../models/GroupLinkListZPRO';
import GreetingMessageZPRO from '../models/GreetingMessageZPRO';
import FarewellMessageZPRO from '../models/FarewellMessageZPRO';
import FarewellPrivateMessageZPRO from '../models/FarewellPrivateMessageZPRO';
import BanListZPRO from '../models/BanListZPRO';
import TenantApiZPRO from '../models/TenantApiZPRO';
import NotificationZPRO from '../models/NotificationZPRO';
import BaileysSessionsZPRO from '../models/BaileysSessionsZPRO';
import BaileysZPRO from '../models/BaileysZPRO';
import MessageUpsertZPRO from '../models/MessageUpsertZPRO';
import PlanZPRO from '../models/PlanZPRO';

// Services
import VerifyTicketsChatBotInactivesZPRO from '../jobs/VerifyTicketsChatBotInactivesZPRO';
import SendMessageAutoCloseZPRO from '../services/SendMessageAutoCloseZPRO';
import SendMessageWorkZPRO from '../services/SendMessageWorkZPRO';
import SendWabaMessagesZPRO from '../services/SendWabaMessagesZPRO';
import SendMeowMessagesZPRO from '../services/SendMeowMessagesZPRO';
import CheckTenantsTrialZPRO from '../jobs/CheckTenantsTrialZPRO';
import SyncMessageWorkZPRO from '../jobs/SyncMessageWorkZPRO';
import SendMessageBirthdayZPRO from '../services/SendMessageBirthdayZPRO';
import SendMessageWorkIndividualBaileysCheckZPRO from '../services/SendMessageWorkIndividualBaileysCheckZPRO';
import SendHubMessagesZPRO from '../services/SendHubMessagesZPRO';
import { CreateFolders } from '../services/CustomServices/CreateFoldersZPRO';
import { GetMeowStatus } from '../services/WbotMeow/GetMeowStatusZPRO';
import { FetchQRCodeMeow } from '../services/CustomServices/FetchQRCodeMeowZPRO';
import BullQueueServicesZPRO from '../services/BullQueueServicesZPRO';

interface WhatsAppFilter {
  enabled?: boolean;
  status?: string;
  birthDayDate?: string;
}

const sequelize = new Sequelize(dbConfig);

const models = [
  UserZPRO,
  ContactZPRO,
  TicketZPRO,
  MessageZPRO,
  MessageOffLineZPRO,
  WhatsappZPRO,
  ContactCustomFieldZPRO,
  SettingZPRO,
  AutoReplyZPRO,
  StepsReplyZPRO,
  StepsReplyActionZPRO,
  QueueZPRO,
  UsersQueuesZPRO,
  TenantZPRO,
  AutoReplyLogsZPRO,
  UserMessagesLogZPRO,
  FastReplyZPRO,
  TagZPRO,
  ContactWalletZPRO,
  ContactTagZPRO,
  CampaignZPRO,
  CampaignContactsZPRO,
  ApiConfigZPRO,
  ApiMessageZPRO,
  LogTicketZPRO,
  ChatFlowZPRO,
  KanbanZPRO,
  TicketProtocolZPRO,
  TicketEvaluationZPRO,
  PrivateMessageZPRO,
  GroupMessagesZPRO,
  UsersPrivateGroupsZPRO,
  ReadPrivateMessageGroupsZPRO,
  TodoListZPRO,
  TicketNotes,
  GhostListZPRO,
  WordListZPRO,
  FarewellMessageZPRO,
  FarewellPrivateMessageZPRO,
  GreetingMessageZPRO,
  BanListZPRO,
  TenantApiZPRO,
  ParticipantsListZPRO,
  GroupLinkListZPRO,
  NotificationZPRO,
  BaileysSessionsZPRO,
  BaileysZPRO,
  MessageUpsertZPRO,
  PlanZPRO
];

sequelize.addModels(models);

let isProcessing = false;

async function processQueues(): Promise<void> {
  if (isProcessing) {
    Logger.warn('Process already running, skipping this interval.');
    return;
  }

  isProcessing = true;
  Logger.info(':::: ZDG :::: Z-PRO :::: DATABASE CONNECTED ON: Fila 1');

  try {
    await BullQueueServicesZPRO.processJobs();
  } catch (error) {
    Logger.error('Error processing queues:', error);
  } finally {
    isProcessing = false;
  }
}

const startIntervalAsync = async (): Promise<void> => {
  setInterval(async () => {
    Logger.info(':::: ZDG :::: Z-PRO :::: Executing Send Message Auto Close Jobs');
    try {
      await SendMessageAutoCloseZPRO.handle();
      await VerifyTicketsChatBotInactivesZPRO.handle();
    } catch (error) {
      Logger.error({ message: 'Error executing Send Message Auto Close', error });
    }
  }, 60000);
};

const startIntervalMessageWorkAsync = async (): Promise<void> => {
  cron.schedule('0 11 * * *', async () => {
    Logger.info(':::: ZDG :::: Z-PRO :::: Executing Send Message Work Jobs');
    try {
      await SendMessageWorkZPRO.handle();
    } catch (error) {
      Logger.error(':::: ZDG :::: Z-PRO :::: Error executing Send Message Work: ' + JSON.stringify(error) + ' }');
    }
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });
};

const startIntervalBaileysCheckAsync = async (): Promise<void> => {
  setInterval(async () => {
    Logger.info(':::: ZDG :::: Z-PRO :::: Executing Baileys Check Jobs');
    try {
      const whatsapps = await WhatsappZPRO.findAll({
        where: {
          status: "CONNECTED",
          enabled: "baileys"
        }
      });
      
      for (const whatsapp of whatsapps) {
        await SendMessageWorkIndividualBaileysCheckZPRO.handle(whatsapp);
      }
    } catch (error) {
      Logger.error(':::: ZDG :::: Z-PRO :::: Error executing Baileys Check Delivery: ' + JSON.stringify(error) + ' }');
    }
  }, 120000);
};

const startIntervalWabaAsync = async (): Promise<void> => {
  setInterval(async () => {
    Logger.info(':::: ZDG :::: Z-PRO :::: Executing Waba Jobs');
    try {
      await SendWabaMessagesZPRO.handle();
    } catch (error) {
      Logger.error({ message: 'Error executing Send Waba Messages', error });
    }
  }, 30000);
};

const startIntervalMeowAsync = async (): Promise<void> => {
  setInterval(async () => {
    Logger.info(':::: ZDG :::: Z-PRO :::: Executing Meow Jobs');
    try {
      await SendMeowMessagesZPRO.handle();
    } catch (error) {
      Logger.error({ message: 'Error executing Send Meow Messages', error });
    }
  }, 30000);
};

const startIntervalStatusMeowAsync = async (): Promise<void> => {
  setInterval(async () => {
    Logger.info(':::: ZDG :::: Z-PRO :::: Executing Status Meow Jobs');
    try {
      const whatsapps = await WhatsappZPRO.findAll({
        where: {
          status: "meow"
        }
      });
      
      for (const whatsapp of whatsapps) {
        await GetMeowStatus(whatsapp);
        FetchQRCodeMeow(5);
      }
    } catch (error) {
      Logger.error({ message: 'Error executing Get Meow Status', error });
    }
  }, 120000);
};

const startIntervalHubAsync = async (): Promise<void> => {
  setInterval(async () => {
    Logger.info(':::: ZDG :::: Z-PRO :::: Executing Hub Jobs');
    try {
      await SendHubMessagesZPRO.handle();
    } catch (error) {
      Logger.error({ message: 'Error executing Send Hub Messages', error });
    }
  }, 30000);
};

const startIntervalCheckTrialAsync = async (): Promise<void> => {
  setInterval(async () => {
    Logger.info(':::: ZDG :::: Z-PRO :::: Executing Trial Jobs');
    try {
      await CheckTenantsTrialZPRO.handle();
    } catch (error) {
      Logger.error({ message: 'Error executing Check Trial', error });
    }
  }, 3600000);
};

const startScheduledBirthdayMessage = async (): Promise<void> => {
  cron.schedule('0 12 * * *', async () => {
    Logger.info(':::: ZDG :::: Z-PRO :::: Executing Send Message Birthday Jobs');
    try {
      const whatsapps = await WhatsappZPRO.findAll({
        where: {
          status: "CONNECTED",
          birthDayDate: "enabled"
        }
      });
      
      for (const whatsapp of whatsapps) {
        await SendMessageBirthdayZPRO.handle(whatsapp);
      }
    } catch (error) {
      Logger.error(':::: ZDG :::: Z-PRO :::: Error executing Birthday Message: ' + JSON.stringify(error) + ' }');
    }
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });
};

const startIntervalSyncMessageWorkAsync = async (): Promise<void> => {
  const executeSync = async () => {
    try {
      await SyncMessageWorkZPRO.handle();
    } catch (error) {
      // Silent error
    }
    
    const randomDelay = Math.floor(Math.random() * (300000 - 60000) + 60000);
    setTimeout(executeSync, randomDelay);
  };
  
  executeSync();
};

// Initialize everything
try {
  SyncMessageWorkZPRO.handle();
} catch (error) {
  // Silent error
}

// Start all intervals
startIntervalAsync();
startIntervalWabaAsync();
startIntervalMeowAsync();
startIntervalStatusMeowAsync();
startIntervalCheckTrialAsync();
startIntervalBaileysCheckAsync();
startIntervalMessageWorkAsync();
startScheduledBirthdayMessage();
startIntervalHubAsync();
startIntervalSyncMessageWorkAsync();

// Create folders
CreateFolders();

// Setup database connection handler
sequelize.afterConnect(() => {
  Logger.info(':::: ZDG :::: Z-PRO :::: DATABASE CONNECTED ON');
});

export default sequelize; 