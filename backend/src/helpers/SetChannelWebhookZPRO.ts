import WhatsappZPRO from '../models/WhatsappZPRO';
import { showHubToken } from './ShowHubTokenZPRO';
import { Client, MessageSubscription } from 'notificamehubsdk';
import { logger } from '../utils/loggerZPRO';

interface Channel {
  tenantId: string;
  wabaId: string;
  toString(): string;
}

interface WhatsappUpdate {
  id: string;
}

const setChannelWebhook = async (channel: Channel, whatsappId: string): Promise<void> => {
  try {
    // Obter token do hub
    const hubToken = await showHubToken(channel.tenantId.toString());
    
    // Inicializar cliente do hub
    const client = new Client(hubToken);
    
    // Construir URL do webhook
    const webhookUrl = `${process.env.BACKEND_URL}/hub-webhook` + channel.wabaId;
    
    // Configurar subscrição da mensagem
    const subscription = new MessageSubscription(
      { url: webhookUrl },
      { channel: channel.wabaId }
    );

    // Criar subscrição
    await client.createSubscription(subscription)
      .then(response => {
        logger.info(`::: Z-PRO ::: Webhook CONNECTED ::: ${response}`);
      })
      .catch(error => {
        logger.warn(`::: Z-PRO ::: Webhook e ${error}`);
      });

    // Atualizar status do WhatsApp
    await WhatsappZPRO.update(
      { status: 'CONNECTED' },
      { where: { id: whatsappId } }
    );

  } catch (error) {
    logger.error(`Error setting channel webhook: ${error}`);
    throw error;
  }
};

export { setChannelWebhook }; 