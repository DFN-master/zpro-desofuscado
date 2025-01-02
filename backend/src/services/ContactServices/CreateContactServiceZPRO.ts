import AppError from '../../errors/AppError';
import socketEmit from '../../helpers/socketEmit';
import Contact from '../../models/Contact';
import ContactWallet from '../../models/ContactWallet';
import Setting from '../../models/Setting';
import request from 'request';
import logger from '../../utils/logger';

interface Wallet {
  id?: number;
}

interface CreateContactData {
  name: string;
  number: string;
  email?: string;
  extraInfo?: string[];
  tenantId: number;
  wallets?: Wallet[];
  cpf?: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  birthdayDate?: Date;
}

interface WebhookData {
  method: string;
  url: string;
  headers: {
    'Content-Type': string;
  };
  payload: {
    type: string;
    data: any;
  };
}

const sendWebhook = async (tenantId: number, contactData: any): Promise<void> => {
  const webhookEnabled = await Setting.findOne({
    where: {
      key: 'webhook',
      tenantId
    }
  });

  if (webhookEnabled && webhookEnabled.value === 'enabled') {
    try {
      const webhookUrl = await Setting.findOne({
        where: {
          key: 'webhookUrl',
          tenantId
        }
      });

      if (webhookUrl && webhookUrl.value === 'enabled') {
        const webhookToken = await Setting.findOne({
          where: {
            key: 'webhookToken',
            tenantId
          }
        });

        if (webhookToken) {
          const method = 'POST';
          const headers = {
            'Content-Type': 'application/json'
          };

          const webhookData: WebhookData = {
            method,
            url: webhookToken.value,
            headers,
            payload: {
              type: 'contact-create',
              data: contactData
            }
          };

          request(webhookData, (error, response) => {
            if (error) {
              throw new Error(error.message);
            } else {
              logger.info('Webhook enviado com sucesso.');
            }
          });
        } else {
          logger.info('Configuração \'webhookToken\' não encontrada para o usuário.');
        }
      } else {
        logger.info('Configuração \'webhookUrl\' não encontrada para o usuário.');
      }
    } catch (err) {
      logger.info('Ocorreu um erro:', err);
    }
  }
};

const CreateContactService = async ({
  name,
  number,
  email = '',
  extraInfo = [],
  tenantId,
  wallets,
  cpf,
  firstName,
  lastName,
  businessName,
  birthdayDate
}: CreateContactData): Promise<Contact> => {

  const contactExists = await Contact.findOne({
    where: {
      number,
      tenantId
    }
  });

  if (contactExists) {
    throw new AppError('ERR_DUPLICATED_CONTACT');
  }

  const contact = await Contact.create({
    name,
    number,
    email,
    extraInfo,
    tenantId,
    cpf,
    firstName,
    lastName,
    businessName,
    birthdayDate
  }, {
    include: [
      "Tags",
      "ExtraInfo",
      {
        association: "Wallets",
        attributes: ["id", "name"]
      }
    ]
  });

  if (wallets) {
    await ContactWallet.destroy({
      where: {
        tenantId,
        contactId: contact.id
      }
    });

    const contactWallets = [];

    wallets.forEach(wallet => {
      contactWallets.push({
        walletId: !wallet.id ? wallet : wallet.id,
        contactId: contact.id,
        tenantId
      });
    });

    await ContactWallet.bulkCreate(contactWallets);
  }

  await contact.reload({
    attributes: [
      'id',
      'name',
      'number',
      'email',
      'profilePicUrl',
      'extraInfo',
      'tenantId',
      'cpf',
      'firstName', 
      'lastName'
    ],
    include: [
      "Tags",
      "ExtraInfo",
      {
        association: "Wallets",
        attributes: ["id", "name"]
      }
    ]
  });

  try {
    await sendWebhook(tenantId, contact);
  } catch (err) {
    logger.warn('Webhook error:', err);
  }

  socketEmit({
    tenantId,
    type: 'contact:update',
    payload: contact
  });

  return contact;
};

export default CreateContactService; 