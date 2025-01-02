import AppError from '../../errors/AppErrorZPRO';
import SocketEmitter from '../../helpers/socket/socketEmitZPRO';
import Contact from '../../models/ContactZPRO';
import ContactWallet from '../../models/ContactWalletZPRO';
import Setting from '../../models/SettingZPRO';
import request from 'request';
import logger from '../../utils/loggerZPRO';

interface IWallet {
  id?: number;
  walletId: number;
}

interface IRequest {
  wallets: IWallet[];
  contactId: number;
  tenantId: number;
}

interface IWebhookData {
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

const UpdateContactWalletsService = async ({
  wallets,
  contactId,
  tenantId
}: IRequest): Promise<Contact> => {
  // Delete existing wallets
  await ContactWallet.destroy({
    where: {
      tenantId,
      contactId
    }
  });

  // Function to send webhook
  async function sendWebhook(tenantId: number, contactData: any): Promise<void> {
    const webhookEnabled = await Setting.findOne({
      where: {
        key: 'webhook',
        tenantId
      }
    });

    if (webhookEnabled && webhookEnabled.value === 'enabled') {
      try {
        const webhookUrlSetting = await Setting.findOne({
          where: {
            key: 'webhookUrl',
            tenantId
          }
        });

        if (webhookUrlSetting && webhookUrlSetting.value === 'enabled') {
          const webhookUrl = await Setting.findOne({
            where: {
              key: 'contact-update-webhook',
              tenantId
            }
          });

          if (webhookUrl) {
            const type = 'contact:update';
            const payload = {
              type,
              data: contactData
            };

            const webhookData: IWebhookData = {
              method: 'POST',
              url: webhookUrl.value,
              headers: {},
              payload,
              headers: {
                'Content-Type': 'application/json'
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
            logger.info('Webhook não encontrado para o usuário.');
          }
        } else {
          logger.info('Configuração webhook não está habilitada para o usuário.');
        }
      } catch (err) {
        logger.info('Ocorreu um erro:', err);
      }
    }
  }

  // Create new wallet associations
  const walletsToCreate = wallets.map(wallet => ({
    walletId: !wallet.id ? wallet : wallet.id,
    contactId,
    tenantId
  }));

  await ContactWallet.bulkCreate(walletsToCreate);

  // Find updated contact with associations
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
      'profilePicUrl',
      'extraInfo',
      'tenantId',
      'birthdayDate',
      'businessName',
      'cpf'
    ],
    include: [
      'tags',
      'extraInfo',
      {
        association: 'wallets',
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
    logger.warn(`Webhook error: ${err}`);
  }

  // Emit socket event
  SocketEmitter({
    tenantId,
    type: 'contact:update',
    payload: contact
  });

  return contact;
};

export default UpdateContactWalletsService; 