import { Request } from 'express';
import socketEmitZPRO from '../../helpers/socket/socketEmitZPRO';
import Contact from '../../models/ContactZPRO';
import Setting from '../../models/SettingZPRO';
import Tenant from '../../models/TenantZPRO';
import { logger } from '../../helpers/loggerZPRO';
import axios from 'axios';

interface CreateOrUpdateContactData {
  name?: string;
  number?: string;
  profilePicUrl?: string;
  isGroup?: boolean;
  tenantId: number;
  pushname?: string;
  isUser?: boolean;
  isWAContact?: boolean;
  email?: string;
  telegramId?: string;
  instagramPK?: string;
  messengerId?: string;
  extraInfo?: any[];
  cpf?: string;
  birthdayDate?: Date;
  origem?: string;
}

interface WebhookData {
  type: string;
  payload: any;
}

const sendWebhook = async (tenantId: number, contactData: any): Promise<void> => {
  try {
    const setting = await Setting.findOne({
      where: {
        key: 'webhook',
        tenantId
      }
    });

    if (setting && setting.value === 'enabled') {
      const webhookUrl = await Setting.findOne({
        where: {
          key: 'webhookUrl',
          tenantId
        }
      });

      if (webhookUrl && webhookUrl.value === 'enabled') {
        const webhookConfig = await Setting.findOne({
          where: {
            key: 'webhookConfig',
            tenantId
          }
        });

        if (webhookConfig) {
          const webhookData: WebhookData = {
            type: 'contact:update',
            payload: contactData
          };

          const config = {
            method: 'POST',
            url: webhookConfig.value,
            headers: {
              'Content-Type': 'application/json'
            },
            data: webhookData
          };

          await axios(config);
          logger.info('ZDG ::: Z-PRO ::: Webhook enviado com sucesso.');
        } else {
          logger.info('ZDG ::: Z-PRO ::: Configuração \'webhookUrl\' não encontrada para o usuário.');
        }
      } else {
        logger.info('ZDG ::: Z-PRO ::: Webhook não está habilitada ou não encontrada para o usuário 2.');
      }
    } else {
      logger.info('ZDG ::: Z-PRO ::: Webhook não está habilitada ou não encontrada para o usuário.');
    }
  } catch (error) {
    logger.info('ZDG ::: Z-PRO ::: Webhook error:', error);
  }
};

const CreateOrUpdateContactService = async ({
  name,
  number,
  profilePicUrl,
  isGroup,
  tenantId,
  pushname,
  isUser,
  isWAContact,
  email = '',
  telegramId,
  instagramPK,
  messengerId,
  extraInfo = [],
  cpf,
  birthdayDate,
  origem = 'whatsapp'
}: CreateOrUpdateContactData): Promise<Contact> => {
  
  const cleanNumber = isGroup 
    ? number || telegramId?.toString() || instagramPK?.toString()
    : (number || telegramId?.toString() || instagramPK?.toString())?.replace(/[^0-9]/g, '');

  let contact: Contact | null = null;

  // Buscar contato existente baseado na origem
  if (origem === 'whatsapp') {
    contact = await Contact.findOne({
      where: { 
        number: cleanNumber,
        tenantId
      }
    });
  }

  if (origem === 'telegram' && telegramId) {
    contact = await Contact.findOne({
      where: {
        telegramId,
        tenantId
      }
    });
  }

  if (origem === 'instagram' && instagramPK) {
    contact = await Contact.findOne({
      where: {
        instagramPK,
        tenantId
      }
    });
  }

  if (origem === 'messenger' && messengerId) {
    contact = await Contact.findOne({
      where: {
        messengerId,
        tenantId
      }
    });
  }

  if (contact) {
    // Verificar configurações do tenant
    const tenant = await Tenant.findByPk(tenantId, {
      attributes: ['settings']
    });

    if (tenant?.settings === 'disabled') {
      await contact.update({
        profilePicUrl,
        pushname,
        isUser,
        isWAContact,
        telegramId,
        instagramPK,
        messengerId
      });
    } else {
      await contact.update({
        name,
        profilePicUrl,
        pushname,
        isUser,
        isWAContact,
        telegramId,
        instagramPK,
        messengerId
      });
    }

    try {
      await sendWebhook(contact.tenantId, contact);
    } catch (error) {
      logger.warn('ZDG ::: Z-PRO ::: Ocorreu um erro:', error);
    }

  } else {
    // Criar novo contato
    contact = await Contact.create({
      name,
      number: cleanNumber,
      profilePicUrl,
      email,
      isGroup,
      pushname,
      isUser,
      isWAContact,
      tenantId,
      extraInfo,
      telegramId,
      instagramPK,
      messengerId,
      cpf,
      birthdayDate
    });

    try {
      await sendWebhook(tenantId, contact);
    } catch (error) {
      logger.warn('ZDG ::: Z-PRO ::: Ocorreu um erro:', error);
    }
  }

  socketEmitZPRO({
    tenantId,
    type: 'contact:update',
    payload: contact
  });

  return contact;
};

export default CreateOrUpdateContactService; 