import AppError from '../../errors/AppErrorZPRO';
import SocketEmit from '../../helpers/socketEmitZPRO';
import Contact from '../../models/ContactZPRO';
import ContactTag from '../../models/ContactTagZPRO';
import Setting from '../../models/SettingZPRO';
import request from 'request';
import logger from '../../utils/loggerZPRO';

interface UpdateContactTagsData {
  tags: number[] | any[];
  contactId: number;
  tenantId: number;
}

interface WebhookData {
  method: string;
  url: string;
  headers: {
    'Content-Type': string;
  };
  payload: {
    event: string;
    record: any;
  };
}

const UpdateContactTagsService = async ({
  tags,
  contactId,
  tenantId
}: UpdateContactTagsData): Promise<Contact> => {
  // Delete existing tags
  await ContactTag.destroy({
    where: {
      tenantId,
      contactId
    }
  });

  // Send webhook
  const sendWebhook = async (tenantId: number, contact: Contact): Promise<void> => {
    const logMessage = ':::: ZDG :::: Z-PRO :::: Webhook enviado com sucesso.';
    
    try {
      // Check if webhook is enabled
      const webhookEnabled = await Setting.findOne({
        where: {
          key: 'webhook',
          tenantId
        }
      });

      if (webhookEnabled && webhookEnabled.value === 'enabled') {
        // Get webhook URL
        const webhookUrl = await Setting.findOne({
          where: {
            key: 'webhookUrl',
            tenantId
          }
        });

        if (webhookUrl && webhookUrl.value === 'enabled') {
          // Get webhook update user setting
          const webhookUpdate = await Setting.findOne({
            where: {
              key: 'webhookUpdate',
              tenantId  
            }
          });

          if (webhookUpdate) {
            const event = 'contact:update';
            
            const webhookData: WebhookData = {
              method: 'POST',
              url: webhookUpdate.value,
              headers: {
                'Content-Type': 'application/json'
              },
              payload: {
                event,
                record: contact
              }
            };

            request(webhookData, (error, response) => {
              if (error) {
                throw new Error(error.message);
              } else {
                logger.info(logMessage);
              }
            });

          } else {
            logger.info(':::: ZDG :::: Z-PRO :::: Configuração \'webhookUrl\' não está habilitada ou não encontrada para o usuário.');
          }
        } else {
          logger.info(':::: ZDG :::: Z-PRO :::: Configuração \'webhook\' não está habilitada ou não encontrada para o usuário 3.');
        }
      }
    } catch (err) {
      logger.info(':::: ZDG :::: Z-PRO :::: Ocorreu um erro:', err);
    }
  };

  // Create new tags
  const contactTags = [];
  
  tags.forEach(tag => {
    contactTags.push({
      tagId: !tag.id ? tag : tag.id,
      contactId,
      tenantId
    });
  });

  await ContactTag.bulkCreate(contactTags);

  // Get updated contact
  const contact = await Contact.findOne({
    where: {
      id: contactId,
      tenantId
    },
    attributes: [
      'id',
      'name',
      'number', 
      'email',
      'profilePic',
      'extraInfo',
      'birthdayDate',
      'businessName',
      'cpf',
      'firstName',
      'lastName'
    ],
    include: [
      'wallets',
      'tags',
      {
        association: 'extraInfo',
        attributes: ['id', 'name']
      }
    ]
  });

  if (!contact) {
    throw new AppError('ERR_NO_CONTACT_FOUND', 404);
  }

  try {
    await sendWebhook(tenantId, contact);
  } catch (err) {
    logger.warn(':::: ZDG :::: Z-PRO :::: Webhook error: ' + err);
  }

  // Emit socket event
  SocketEmit({
    tenantId,
    type: 'contact-update-tag',
    payload: contact
  });

  return contact;
};

export default UpdateContactTagsService; 