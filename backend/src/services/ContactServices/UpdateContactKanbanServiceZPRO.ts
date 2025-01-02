import { Request } from 'express';
import Contact from '../../models/Contact';
import Setting from '../../models/Setting';
import request from 'request';
import logger from '../../utils/loggerZPRO';

interface UpdateKanbanData {
  contactId: number;
  kanban: string;
}

interface WebhookData {
  method: string;
  url: string;
  headers: {
    'Content-Type': string;
  };
  body: {
    method: string;
    contact: any;
  };
}

const sendWebhook = async (tenantId: number, contactData: any): Promise<void> => {
  try {
    // Verifica configuração do webhook
    const webhookSetting = await Setting.findOne({
      where: {
        key: 'webhook',
        tenantId
      }
    });

    if (webhookSetting && webhookSetting.value === 'enabled') {
      // Verifica se webhook está habilitado para atualização
      const webhookEnabled = await Setting.findOne({
        where: {
          key: 'webhookUpdate',
          tenantId
        }
      });

      if (webhookEnabled && webhookEnabled.value === 'enabled') {
        // Busca URL do webhook
        const webhookUrl = await Setting.findOne({
          where: {
            key: 'webhookUrl',
            tenantId
          }
        });

        if (webhookUrl) {
          const method = 'contact-update-kanban';
          
          const webhookData: WebhookData = {
            method: 'POST',
            url: webhookUrl.value,
            headers: {
              'Content-Type': 'application/json'
            },
            body: {
              method,
              contact: contactData
            }
          };

          request(webhookData, (error, response) => {
            if (error) {
              throw new Error(error.message);
            } else {
              logger.info(':::: ZDG :::: Z-PRO :::: Webhook enviado com sucesso.');
            }
          });
        } else {
          logger.info(':::: ZDG :::: Z-PRO :::: Configuração \'webhookUrl\' não encontrada para o usuário.');
        }
      } else {
        logger.info(':::: ZDG :::: Z-PRO :::: Configuração \'webhook\' não está habilitada ou não encontrada para o usuário 3.');
      }
    }
  } catch (err) {
    logger.info(':::: ZDG :::: Z-PRO :::: enviarWebhook error: ', err);
  }
};

const UpdateKanbanService = async ({
  contactId,
  kanban
}: UpdateKanbanData): Promise<Contact> => {
  // Busca o contato
  const contact = await Contact.findByPk(contactId);

  if (!contact) {
    throw new Error('Contato não encontrado');
  }

  // Atualiza o status do kanban
  await contact.update({
    kanban
  });

  // Envia webhook
  try {
    await sendWebhook(contact.tenantId, contact);
  } catch (err) {
    logger.warn(':::: ZDG :::: Z-PRO :::: Ocorreu um erro:', err);
  }

  return contact;
};

export default UpdateKanbanService; 