import path from 'path';
import { MessageMedia } from 'whatsapp-web.js';
import { logger } from '../utils/loggerZPRO';
import { getWbot } from '../libs/wbotZPRO';
import CampaignContacts from '../models/CampaignContactsZPRO';
import Whatsapp from '../models/WhatsappZPRO';
import { getWbotBaileys } from '../libs/wbot-baileysZPRO';
import * as Sentry from '@sentry/node';
import fs from 'fs';
import mime from 'mime-types';
import { sendMessageWorkIndividualBaileysCheck } from './SendMessageWorkIndividualBaileysCheckZPRO';
import { sendMediaMessageCampaignServiceNoCreate } from '../services/SendMediaMessageCampaignServiceNoCreateZPRO';
import { sendTextCampaignService } from '../services/SendTextCampaignServiceZPRO';

interface MessageData {
  jobId: string;
  campaignContacts: {
    id: number;
    campaign: {
      tenant: {
        toString(): string;
      };
    };
  };
  whatsappId: number;
  messageRandom: string;
  body: string;
  mediaName?: string;
}

interface MessageOptions {
  sendAudioAsVoice?: boolean;
  caption?: string;
}

const getMessageOptions = async (
  fileName: string,
  filePath: string,
  body: string | null,
  caption: string,
  tenant: string
) => {
  try {
    const mimeType = mime.lookup(filePath);
    const messageBody = (body === null || body === undefined ? undefined : body.body) || caption;

    if (!mimeType) {
      throw new Error('Invalid mime type');
    }

    const mediaType = mimeType.split('/')[0];

    let messageOptions: any;

    if (mediaType === 'video') {
      messageOptions = {
        video: fs.readFileSync(filePath),
        caption: messageBody || undefined,
        fileName
      };
    } else if (mediaType === 'audio') {
      const audioPath = await sendMessageWorkIndividualBaileysCheck(filePath, body, tenant);
      messageOptions = {
        audio: fs.readFileSync(audioPath),
        mimetype: 'audio/mpeg',
        ptt: true
      };
    } else if (mediaType === 'document' || mediaType === 'application') {
      messageOptions = {
        document: fs.readFileSync(filePath),
        caption: messageBody || undefined,
        fileName,
        mimetype: mimeType
      };
    } else {
      messageOptions = {
        image: fs.readFileSync(filePath),
        caption: messageBody || undefined,
        fileName,
        mimetype: mimeType
      };
    }

    return messageOptions;
  } catch (err) {
    Sentry.captureException(err);
    console.log(err);
    return null;
  }
};

export default {
  key: (jobId: string) => `${jobId}::: Z-PRO ::: ZDG`,
  options: {
    delay: 15000,
    attempts: 10,
    removeOnComplete: true,
    backoff: {
      type: 'fixed',
      delay: 60000 * 3
    }
  },
  async handle({ data }: { data: MessageData }): Promise<any> {
    try {
      const whatsapp = await Whatsapp.findByPk(data.whatsappId);

      if (whatsapp?.type === 'baileys') {
        const wbot = await getWbotBaileys(data.whatsappId);
        let sentMessage;

        if (data.mediaName) {
          const filePath = path.join(
            __dirname,
            '..',
            '..',
            'public',
            data.campaignContacts.campaign.tenant.toString()
          );
          const mediaPath = path.join(filePath, data.mediaName);
          const messageOptions = await getMessageOptions(
            data.mediaName,
            mediaPath,
            data.body,
            data.body,
            data.campaignContacts.campaign.tenant.toString()
          );

          sentMessage = await wbot.sendMessage(
            `${data.whatsappId}@s.whatsapp.net`,
            Object.assign({}, messageOptions)
          );
        } else {
          sentMessage = await wbot.sendMessage(
            `${data.whatsappId}@s.whatsapp.net`,
            { text: data.body }
          );
        }

        await CampaignContacts.update(
          {
            messageId: sentMessage.key.id,
            messageRandom: data.messageRandom,
            body: data.body,
            mediaName: data.mediaName,
            timestamp: sentMessage.messageTimestamp,
            jobId: data.jobId
          },
          { where: { id: data.campaignContacts.id } }
        );

        return sentMessage;
      }

      if (whatsapp?.type === 'web') {
        const wbot = getWbot(data.whatsappId);
        let sentMessage;

        if (data.mediaName) {
          const filePath = path.join(
            __dirname,
            '..',
            '..',
            'public',
            data.campaignContacts.campaign.tenant.toString()
          );
          const mediaPath = path.join(filePath, data.mediaName);
          const media = MessageMedia.fromFilePath(mediaPath);

          sentMessage = await wbot.sendMessage(
            `${data.whatsappId}@c.us`,
            media,
            { sendAudioAsVoice: true, caption: data.body }
          );
        } else {
          sentMessage = await wbot.sendMessage(
            `${data.whatsappId}@c.us`,
            data.body,
            { linkPreview: false }
          );
        }

        await CampaignContacts.update(
          {
            messageId: sentMessage.id.id,
            messageRandom: data.messageRandom,
            body: data.body,
            mediaName: data.mediaName,
            timestamp: sentMessage.timestamp,
            jobId: data.jobId
          },
          { where: { id: data.campaignContacts.id } }
        );

        return sentMessage;
      }

      if (whatsapp?.type === 'meow') {
        let sentMessage;

        if (data.mediaName) {
          const filePath = path.join(
            __dirname,
            '..',
            '..',
            'public',
            data.campaignContacts.campaign.tenant.toString()
          );
          const mediaPath = path.join(filePath, data.mediaName);

          sentMessage = await sendMediaMessageCampaignServiceNoCreate(
            mediaPath,
            data.body,
            data.whatsappId,
            whatsapp,
            whatsapp.tenant
          );
        } else {
          sentMessage = await sendTextCampaignService(
            data.body,
            data.whatsappId,
            whatsapp
          );
        }

        await CampaignContacts.update(
          {
            messageId: sentMessage.message.message.Id,
            messageRandom: data.messageRandom,
            body: data.body,
            mediaName: data.mediaName,
            timestamp: sentMessage.messageTimestamp,
            jobId: data.jobId,
            ack: sentMessage.message.message.Details === 'Sent' ? 2 : 0
          },
          { where: { id: data.campaignContacts.id } }
        );

        return sentMessage;
      }
    } catch (err) {
      logger.error(`Error sending campaign message: ${err}`);
    }
  }
}; 