import WhatsappZPRO from '../models/WhatsappZPRO';
import axios from 'axios';
import db from '../database/indexZPRO';
import { QueryTypes } from 'sequelize';
import { getIO } from '../libs/socketZPRO';
import { logger } from '../utils/loggerZPRO';
import { showWuzapiHost } from './ShowWuzapiHostZPRO';

interface WebhookEvents {
  events: string[];
  url: string;
}

interface WhatsappUpdate {
  status?: string;
  number?: string;
  profilePicUrl?: string;
}

const setMeowWebhook = async (whatsapp: WhatsappZPRO, token: string): Promise<boolean> => {
  const EVENT_TYPES = {
    MESSAGE: 'Message',
    MESSAGE_ACK: 'MessageAck', 
    MESSAGE_PREVIEW: 'Preview',
    CHAT_PRESENCE: 'ChatPresence',
    PRESENCE: 'Presence',
    GROUP: 'Group'
  };

  const STATUS = {
    CONNECTED: 'CONNECTED',
    DISCONNECTED: 'DISCONNECTED'
  };

  const wuzapiHost = await showWuzapiHost(whatsapp.tenantId);
  const webhookUrl = `${wuzapiHost}/webhook`;
  const io = getIO();

  const webhookEvents: WebhookEvents = {
    url: `http://localhost:3100/meow-webhook/${whatsapp.token}`,
    events: [
      EVENT_TYPES.MESSAGE,
      EVENT_TYPES.MESSAGE_ACK,
      EVENT_TYPES.MESSAGE_PREVIEW, 
      EVENT_TYPES.CHAT_PRESENCE,
      EVENT_TYPES.PRESENCE,
      EVENT_TYPES.GROUP
    ]
  };

  try {
    const headers = {
      'Content-Type': 'application/json',
      'Host': token
    };

    const webhookResponse = await axios.post(webhookUrl, webhookEvents, { headers });

    if (webhookResponse) {
      const sessionStatusUrl = `${wuzapiHost}/session/status`;

      try {
        const statusResponse = await axios.get(sessionStatusUrl, { headers });
        
        if (!statusResponse.data.data.wabaId || !statusResponse.data.data.jid) {
          await whatsapp.update({ status: STATUS.DISCONNECTED });
          io.emit(`${whatsapp.tenantId}:whatsapp`, {
            action: 'DISCONNECTED',
            whatsapp
          });
          return false;
        }
      } catch (err) {
        logger.info('Error: Profile status not found.');
      }

      const updateConnectedQuery = `
        UPDATE users 
        SET connected = 1
        WHERE name = ?
      `;

      await db.query(updateConnectedQuery, {
        type: QueryTypes.UPDATE,
        replacements: [whatsapp.token]
      });

      await whatsapp.update({ status: STATUS.CONNECTED });

      let phoneNumber: string;
      const selectJidQuery = `
        SELECT jid
        FROM users 
        WHERE name = ?
      `;

      const [jidResult] = await db.query(selectJidQuery, {
        type: QueryTypes.SELECT,
        replacements: [whatsapp.wabaId]
      });

      if (jidResult && jidResult['jid']) {
        const jid = jidResult['jid'];
        phoneNumber = jid.split(':')[0];
        await whatsapp.update({ number: phoneNumber });
      } else {
        logger.info('Error: JID not found.');
      }

      const avatarUrl = `${wuzapiHost}/user/avatar`;

      const whatsappInstance = await WhatsappZPRO.findOne({
        where: { id: whatsapp.id }
      });

      try {
        const avatarData = {
          number: `${whatsappInstance?.number}`,
          connected: true
        };

        const avatarResponse = await axios.post(avatarUrl, avatarData, { headers });
        await whatsapp.update({ 
          profilePicUrl: avatarResponse.data.data.profilePic 
        });
      } catch (err) {
        logger.info('Error: Profile PIC not found.');
      }

      io.emit(`${whatsapp.tenantId}:whatsapp`, {
        action: 'DISCONNECTED',
        whatsapp
      });
    }

    logger.info('MEOW set successfully and status updated to CONNECTED.');
    return true;

  } catch (err) {
    try {
      await whatsapp.update({ status: STATUS.DISCONNECTED });
    } catch (updateErr) {
      logger.warn('Error setting disconnected:', err);
    }

    io.emit(`${whatsapp.tenantId}:whatsapp`, {
      action: 'DISCONNECTED', 
      whatsapp
    });

    logger.warn('Error setting webhook:', err);
    return false;
  }
};

export { setMeowWebhook }; 