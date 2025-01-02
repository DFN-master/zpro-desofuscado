import { sign } from 'jsonwebtoken';
import { Request } from 'express';
import ApiConfigZPRO from '../../models/ApiConfig/authZPRO';
import authZPRO from '../../config/authZPRO';
import { logger } from '../../utils/loggerZPRO';
import SettingZPRO from '../../models/Setting/SettingZPRO';

interface ICreateApiConfigDTO {
  name: string;
  sessionId: string;
  urlServiceStatus: string;
  urlMessageStatus: string;
  userId: number;
  authToken: string;
  tenantId: number;
}

interface IWebhookData {
  event: string;
  record: any;
  timestamp: Date;
}

const CreateApiConfigService = async ({
  name,
  sessionId,
  urlServiceStatus,
  urlMessageStatus,
  userId,
  authToken,
  tenantId
}: ICreateApiConfigDTO) => {
  const { secret } = authZPRO.default;

  async function sendWebhook(record: any, tenantId: number, data: any): Promise<void> {
    try {
      // Verificar configuração do webhook
      const webhookEnabled = await SettingZPRO.default.findOne({
        where: {
          key: 'webhook',
          tenantId
        }
      });

      if (webhookEnabled?.value === 'enabled') {
        // Verificar URL do webhook
        const webhookUrl = await SettingZPRO.default.findOne({
          where: {
            key: 'webhookUrl',
            tenantId
          }
        });

        if (webhookUrl?.value === 'enabled') {
          // Verificar token do webhook
          const webhookToken = await SettingZPRO.default.findOne({
            where: {
              key: 'token',
              tenantId
            }
          });

          if (webhookToken) {
            const webhookData: IWebhookData = {
              event: 'api-create',
              record: record,
              timestamp: data
            };

            const requestConfig = {
              method: 'POST',
              url: webhookToken.value,
              headers: {
                'Content-Type': 'application/json'
              },
              body: webhookData
            };

            // Enviar webhook
            request(requestConfig, (error, response) => {
              if (error) {
                throw new Error(error.message);
              }
              logger.info('::: Z-PRO ::: Webhook enviado com sucesso.');
            });

          } else {
            logger.info('::: Z-PRO ::: Configuração \'webhook\' não está habilitada ou não encontrada para a api.');
          }
        } else {
          logger.info('::: Z-PRO ::: Configuração \'webhookUrl\' não está habilitada ou não encontrada para a api.');
        }
      }
    } catch (error) {
      logger.info('::: Z-PRO ::: Ocorreu um erro: ', error);
    }
  }

  // Gerar token JWT
  const jwtData = {
    tenantId,
    profile: 'admin',
    sessionId
  };

  const token = sign(jwtData, secret, { expiresIn: '730d' });

  // Criar configuração da API
  const apiConfig = await ApiConfigZPRO.default.create({
    name,
    sessionId,
    token,
    authToken,
    urlServiceStatus,
    urlMessageStatus, 
    userId,
    tenantId
  });

  // Enviar webhook
  try {
    await sendWebhook(apiConfig.name, apiConfig.tenantId, apiConfig);
  } catch (error) {
    logger.warn('::: Z-PRO ::: Webhook error: ' + error);
  }

  return apiConfig;
};

export default CreateApiConfigService; 