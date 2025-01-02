import { Request } from 'express';
import AppError from '../../errors/AppErrorZPRO';
import socketEmit from '../../helpers/socketEmitZPRO';
import Contact from '../../models/ContactZPRO';
import ContactCustomField from '../../models/ContactCustomFieldZPRO';
import ContactWallet from '../../models/ContactWalletZPRO';
import Setting from '../../models/SettingZPRO';
import logger from '../../utils/loggerZPRO';

interface ContactData {
  email?: string;
  name?: string;
  number?: string;
  blocked?: boolean;
  extraInfo?: ExtraInfo[];
  wallets?: Wallet[];
  cpf?: string;
  birthdayDate?: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
}

interface ExtraInfo {
  id?: number;
  name: string;
  value: string;
}

interface Wallet {
  id?: number;
  walletId: number;
}

interface UpdateContactParams {
  contactData: ContactData;
  contactId: number;
  tenantId: number | string;
}

const UpdateContactService = async ({
  contactData,
  contactId,
  tenantId
}: UpdateContactParams): Promise<Contact> => {
  
  // Função auxiliar para enviar webhook
  async function sendWebhook(tenantId: number | string, contact: Contact) {
    try {
      // Buscar configuração de webhook habilitado
      const webhookEnabled = await Setting.findOne({
        where: {
          key: 'webhook',
          tenantId
        }
      });

      if (webhookEnabled && webhookEnabled.value === 'enabled') {
        // Buscar URL do webhook
        const webhookUrl = await Setting.findOne({
          where: {
            key: 'webhookUrl', 
            tenantId
          }
        });

        if (webhookUrl && webhookUrl.value === 'enabled') {
          // Buscar token do webhook
          const webhookToken = await Setting.findOne({
            where: {
              key: 'webhookToken',
              tenantId  
            }
          });

          if (webhookToken) {
            const WEBHOOK_URL = 'https://api.z-api.io/instances/YOUR_INSTANCE/token/YOUR_TOKEN/send-text';
            const payload = {
              phone: contact.number
            };

            const options = {
              method: 'POST',
              url: webhookToken.value,
              headers: {},
              json: payload,
              headers: {
                'Content-Type': 'application/json'
              }
            };

            request(options, (error, response) => {
              if (error) throw new Error(error.message);
              logger.info('Webhook enviado com sucesso');
            });

          } else {
            logger.info('Configuração webhookToken não encontrada para o usuário.');
          }
        } else {
          logger.info('Configuração webhookUrl não encontrada para o usuário.');
        }
      }
    } catch (err) {
      logger.info('Webhook error:', err);
    }
  }

  // Buscar contato existente
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
      'blocked',
      'cpf',
      'birthdayDate',
      'firstName', 
      'lastName',
      'businessName',
      'profilePic'
    ],
    include: [
      'extraInfo',
      'tags',
      {
        association: 'wallets',
        attributes: ['id', 'name']
      }
    ]
  });

  if (!contact) {
    throw new AppError('ERR_NO_CONTACT_FOUND', 404);
  }

  // Atualizar campos extras
  if (contactData.extraInfo) {
    await Promise.all(
      contactData.extraInfo.map(async info => {
        await ContactCustomField.upsert({
          ...info,
          contactId: contact.id
        });
      })
    );

    // Remover campos extras que não estão mais presentes
    await Promise.all(
      contact.extraInfo.map(async field => {
        const exists = contactData.extraInfo.findIndex(i => i.id === field.id);
        if (exists === -1) {
          await ContactCustomField.destroy({
            where: { id: field.id }
          });
        }
      })
    );
  }

  // Atualizar carteiras
  if (contactData.wallets) {
    await ContactWallet.destroy({
      where: {
        tenantId,
        contactId
      }
    });

    const wallets = [];
    contactData.wallets.forEach(wallet => {
      wallets.push({
        walletId: !wallet.id ? wallet : wallet.id,
        contactId,
        tenantId
      });
    });

    await ContactWallet.bulkCreate(wallets);
  }

  // Atualizar dados do contato
  await contact.update({
    name: contactData.name,
    number: contactData.number,
    email: contactData.email,
    blocked: contactData.blocked,
    cpf: contactData.cpf,
    firstName: contactData.firstName,
    lastName: contactData.lastName,
    businessName: contactData.businessName,
    birthdayDate: contactData.birthdayDate
  });

  await contact.reload({
    attributes: [
      'id',
      'name',
      'number', 
      'email',
      'blocked',
      'cpf',
      'birthdayDate',
      'firstName',
      'lastName',
      'businessName',
      'profilePic'
    ],
    include: [
      'extraInfo',
      'tags',
      {
        association: 'wallets',
        attributes: ['id', 'name']
      }
    ]
  });

  // Enviar webhook
  try {
    await sendWebhook(tenantId, contact);
  } catch (err) {
    logger.warn('Erro ao enviar webhook:', err);
  }

  // Emitir evento de atualização
  socketEmit({
    tenantId,
    type: 'contact:update',
    payload: contact
  });

  return contact;
};

export default UpdateContactService; 