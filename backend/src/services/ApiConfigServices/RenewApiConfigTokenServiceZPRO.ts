import { sign } from 'jsonwebtoken';
import ApiConfigZPRO from '../../models/ApiConfigZPRO';
import authConfig from '../../config/authZPRO';
import AppError from '../../errors/AppError';
import logger from '../../utils/loggerZPRO';
import Setting from '../../models/Setting';
import request from 'request';

interface IRenewTokenRequest {
  apiId: number;
  sessionId: string;
  tenantId: number;
}

interface IWebhookData {
  method: string;
  url: string;
  token: string;
}

const RenewApiConfigTokenService = async ({
  apiId,
  sessionId,
  tenantId
}: IRenewTokenRequest): Promise<ApiConfigZPRO> => {
  const { secret } = authConfig;

  // Função auxiliar para enviar webhook
  async function sendWebhook(apiId: number, tenantId: number, token: string): Promise<void> {
    // Verifica se webhook está habilitado
    const webhookEnabled = await Setting.findOne({
      where: {
        key: 'webhook',
        value: tenantId
      }
    });

    if (webhookEnabled && webhookEnabled.value === 'enabled') {
      try {
        // Busca URL do webhook
        const webhookSetting = await Setting.findOne({
          where: {
            key: 'webhookUrl',
            value: tenantId
          }
        });

        if (webhookSetting && webhookSetting.value === 'enabled') {
          // Busca token do webhook
          const webhookToken = await Setting.findOne({
            where: {
              key: 'webhookToken',
              value: tenantId
            }
          });

          if (webhookToken) {
            const method = 'POST';
            const webhookData: IWebhookData = {
              method,
              url: apiId.toString(),
              token
            };

            const requestConfig = {
              method: 'POST',
              url: webhookToken.value,
              headers: {
                'Content-Type': 'application/json'
              },
              json: webhookData
            };

            request(requestConfig, (error, response) => {
              if (error) {
                throw new Error(error.message);
              } else {
                logger.info('Z-PRO ::: Webhook enviado com sucesso.');
              }
            });
          } else {
            logger.info('Z-PRO ::: Configuração \'webhookToken\' não encontrada para a api.');
          }
        } else {
          logger.info('Z-PRO ::: Configuração \'webhook\' não está habilitada para a api.');
        }
      } catch (error) {
        logger.info('Z-PRO ::: enviarWebhook erro:', error);
      }
    }
  }

  // Busca configuração da API
  const apiConfig = await ApiConfigZPRO.findByPk(apiId);

  if (!apiConfig) {
    throw new AppError('ERR_API_CONFIG_NOT_FOUND', 404);
  }

  // Gera novo token
  const tokenData = {
    tenantId,
    profile: 'admin',
    sessionId
  };

  const token = sign(tokenData, secret, {
    expiresIn: '730d'
  });

  try {
    await sendWebhook(apiId, tenantId, token);
  } catch (err) {
    logger.warn(`Z-PRO ::: Ocorreu um erro: ${err}`);
  }

  // Atualiza token na configuração
  await apiConfig.update({
    token
  });

  await apiConfig.reload();

  return apiConfig;
};

export default RenewApiConfigTokenService; 