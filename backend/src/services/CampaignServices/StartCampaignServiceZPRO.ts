import { parseISO, differenceInSeconds, addSeconds, setHours, setMinutes, addDays, isAfter, isBefore, isWithinInterval } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';
import Campaign from '../../models/CampaignZPRO';
import AppError from '../../errors/AppErrorZPRO';
import CampaignContact from '../../models/CampaignContactsZPRO';
import Queue from '../../libs/QueueZPRO_Dig';

interface StartCampaignData {
  campaignId: number;
  tenantId: number;
  options?: any;
}

interface MessageData {
  whatsappId: string;
  message: string;
  number: string;
  mediaUrl?: string;
  mediaName?: string;
  messageRandom: string;
  campaignContact: any;
  options: any;
}

interface ContactData {
  id: number;
  name: string;
  number: string;
  email?: string;
  phoneNumber?: string;
  kanban?: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
}

const getFileNameFromPath = (path: string): string => {
  if (!path) return '';
  const parts = path.split('/');
  return parts[parts.length - 1];
};

const randomInteger = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const mountMessageData = (
  campaign: any,
  campaignContact: any,
  options: any
): MessageData => {
  const messageIndex = randomInteger(1, 3);
  let message = '';

  if (messageIndex === 1) message = campaign.message1;
  if (messageIndex === 2) message = campaign.message2;
  if (messageIndex === 3) message = campaign.message3;

  const patterns = {
    name: /{{name}}/g,
    email: /{{email}}/g,
    phoneNumber: /{{phoneNumber}}/g,
    kanban: /{{kanban}}/g,
    firstName: /{{firstName}}/g,
    lastName: /{{lastName}}/g,
    businessName: /{{businessName}}/g
  };

  const replacePattern = (text: string, pattern: RegExp, value?: string): string => {
    return value ? text.replace(pattern, value) : text.replace(pattern, '');
  };

  let finalMessage = message;
  const { contact } = campaignContact;

  finalMessage = replacePattern(finalMessage, patterns.name, contact.name);
  finalMessage = replacePattern(finalMessage, patterns.email, contact.email);
  finalMessage = replacePattern(finalMessage, patterns.phoneNumber, contact.phoneNumber);
  finalMessage = replacePattern(finalMessage, patterns.kanban, contact.kanban);
  finalMessage = replacePattern(finalMessage, patterns.firstName, contact.firstName);
  finalMessage = replacePattern(finalMessage, patterns.lastName, contact.lastName);
  finalMessage = replacePattern(finalMessage, patterns.businessName, contact.businessName);
  finalMessage = finalMessage.replace(/{{\w+}}/g, '');

  return {
    whatsappId: campaign.whatsappId,
    message: finalMessage,
    number: campaignContact.contact.phoneNumber,
    mediaUrl: campaign.mediaUrl,
    mediaName: getFileNameFromPath(campaign.mediaUrl),
    messageRandom: `message${messageIndex}`,
    campaignContact,
    options
  };
};

const nextDayHoursValid = (date: Date): Date => {
  let nextDate = date;
  const currentDate = new Date();
  
  const diffInDays = differenceInSeconds(nextDate, new Date());
  
  if (diffInDays < 0) {
    nextDate = addDays(nextDate, diffInDays * -1);
  }

  if (nextDate.getHours() < currentDate.getHours()) {
    nextDate = setHours(setMinutes(nextDate, currentDate.getMinutes()), currentDate.getHours());
  }

  const startTime = parseISO('08:00', 'HH:mm', nextDate);
  const endTime = parseISO('20:00', 'HH:mm', nextDate);

  const interval = {
    start: startTime,
    end: endTime
  };

  const isWithinBusinessHours = isWithinInterval(nextDate, interval);
  const isBeforeStart = isBefore(startTime, nextDate);
  const isAfterEnd = isAfter(endTime, nextDate);

  if (!isWithinBusinessHours && isBeforeStart) {
    nextDate = setHours(setMinutes(nextDate, 0), 8);
  }

  if (!isWithinBusinessHours && isAfterEnd && diffInDays === 0) {
    nextDate = addDays(setMinutes(nextDate, 0), 1);
  }

  if (!isWithinBusinessHours && isAfterEnd && diffInDays > 0) {
    nextDate = setMinutes(nextDate, 0);
  }

  return nextDate;
};

const calcDelay = (date: Date, interval: number): number => {
  const diffInSeconds = differenceInSeconds(date, new Date());
  return diffInSeconds * 1000 + interval;
};

const StartCampaignService = async ({
  campaignId,
  tenantId,
  options
}: StartCampaignData): Promise<void> => {
  const campaign = await Campaign.findOne({
    where: { id: campaignId, tenantId },
    include: ['contact']
  });

  if (!campaign) {
    throw new AppError('ERR_CAMPAIGN_NOT_EXISTS', 404);
  }

  const campaignContacts = await CampaignContact.findAll({
    where: { campaignId },
    include: ['contact']
  });

  if (!campaignContacts) {
    throw new AppError('ERROR_CAMPAIGN_CONTACTS_NOT_EXISTS', 404);
  }

  const interval = campaign.interval ? campaign.interval / 1000 : 10000;
  let nextDate = zonedTimeToUtc(campaign.start, 'America/Sao_Paulo');

  const messages = campaignContacts.map(contact => {
    nextDate = addSeconds(nextDate, interval / 1000);
    
    return mountMessageData(campaign, contact, {
      ...options,
      jobId: `campaign_${campaign.id}_contact_${contact.contactId}_id_${contact.id}`,
      delay: calcDelay(nextDate, interval)
    });
  });

  Queue.default.add(campaign.whatsappId + '-SendMessageZPRO', messages);

  await campaign.update({
    status: 'scheduled'
  });
};

export default StartCampaignService; 