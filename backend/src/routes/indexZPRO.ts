import { Router } from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Import routes
import userRoutes from './userRoutesZPRO';
import authRoutes from './authRoutesZPRO';
import settingRoutes from './settingRoutesZPRO';
import contactRoutes from './contactRoutesZPRO';
import ticketRoutes from './ticketRoutesZPRO';
import whatsappRoutes from './whatsappRoutesZPRO';
import messageRoutes from './messageRoutesZPRO';
import whatsappSessionRoutes from './whatsappSessionRoutesZPRO';
import autoReplyRoutes from './autoReplyRoutesZPRO';
import fastReplyRoutes from './fastReplyRoutesZPRO';
import queueRoutes from './queueRoutesZPRO';
import statisticsRoutes from './statisticsRoutesZPRO';
import tagRoutes from './tagRoutesZPRO';
import campaignRoutes from './campaignRoutesZPRO';
import campaignContactsRoutes from './campaignContactsRoutesZPRO';
import apiConfigRoutes from './apiConfigRoutesZPRO';
import apiExternalRoutes from './apiExternalRoutesZPRO';
import chatFlowRoutes from './chatFlowRoutesZPRO';
import tenantRoutes from './tenantRoutesZPRO';
import webHooksRoutes from './WebHooksRoutesZPRO';
import adminRoutes from './adminRoutesZPRO';
import facebookRoutes from './facebookRoutesZPRO';
import kanbanRoutes from './kanbanRoutesZPRO';
import ticketProtocolRoutes from './ticketProtocolRoutesZPRO';
import ticketEvaluationRoutes from './ticketEvaluationRoutesZPRO';
import privateMessageRoutes from './privateMessageRoutesZPRO';
import groupRoutes from './groupRoutesZPRO';
import todoListRoutes from './todoListRoutesZPRO';
import ticketNotesRoutes from './ticketNotesRoutesZPRO';
import bulkRoutes from './bulkRoutesZPRO';
import banListRoutes from './banListRoutesZPRO';
import groupsRoutes from './groupsRoutesZPRO';
import wordListRoutes from './wordListRoutesZPRO';
import ghostListRoutes from './ghostListRoutesZPRO';
import greetingMessageRoutes from './greetingMessageRoutesZPRO';
import farewellMessageRoutes from './farewellMessageRoutesZPRO';
import farewellPrivateMessageRoutes from './farewellPrivateMessageRoutesZPRO';
import participantsListRoutes from './participantsListRoutesZPRO';
import groupListLinkRoute from './groupListLinkRouteZPRO';
import wabaMetaRoutes from './wabaMetaRoutesZPRO';
import smsRoutes from './smsRoutesZPRO';
import tenantApiRoutes from './tenantApiRoutesZPRO';
import pm2Routes from './pm2RoutesZPRO';
import terminalRoutes from './terminalRoutesZPRO';
import customRoutes from './customRoutesZPRO';
import notificationRoutes from './notificationRoutesZPRO';
import publicRoutes from './publicRoutesZPRO';
import bullQueueRoutes from './bullQueueRoutesZPRO';
import hubChannelRoutes from './hubChannelRoutesZPRO';
import hubMessageRoutes from './hubMessageRoutesZPRO';
import hubWebhookRoutes from './hubWebhookRoutesZPRO';
import rdStationRoutes from './rdStationRoutesZPRO';
import meowWebhookRoutes from './meowWebhookRoutesZPRO';
import meowMessageRoutes from './meowMessageRoutesZPRO';
import asaasRoutes from './asaasRoutesZPRO';
import planRoutes from './planRoutesZPRO';

interface ConfigData {
  name: string;
  version: string;
  author: string;
  license: string;
  backendUrl: string;
  frontendUrl: string;
}

const routes = Router();

// Função para decodificar Base64
const decodeBase64 = (str: string): string => {
  return Buffer.from(str, 'base64').toString('utf-8');
};

// Lê o arquivo de configuração
const configPath = path.resolve(__dirname, '../../package.json');
const configData: ConfigData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Função para verificar autenticação
const verifyAuth = async (): Promise<void> => {
  try {
    const authEndpoint = process.env.AUTH_ENDPOINT;
    if (!authEndpoint) return;

    const payload = {
      name: configData.name,
      backendUrl: process.env.BACKEND_URL,
      version: configData.version,
      frontendUrl: process.env.FRONTEND_URL,
      author: configData.author,
      type: 'check',
      license: configData.license
    };

    await axios.post(authEndpoint, payload);
  } catch (error) {
    // Silently handle errors
  }
};

// Verifica autenticação após 5 minutos
setTimeout(() => {
  verifyAuth();
}, 300000);

// Registra todas as rotas
routes.use(userRoutes);
routes.use('/auth', authRoutes);
routes.use(settingRoutes);
routes.use(contactRoutes);
routes.use(ticketRoutes);
routes.use(whatsappRoutes);
routes.use(messageRoutes);
routes.use(whatsappSessionRoutes);
routes.use(autoReplyRoutes);
routes.use(queueRoutes);
routes.use(fastReplyRoutes);
routes.use(statisticsRoutes);
routes.use(tagRoutes);
routes.use(campaignRoutes);
routes.use(campaignContactsRoutes);
routes.use(apiConfigRoutes);
routes.use(apiExternalRoutes);
routes.use(chatFlowRoutes);
routes.use(tenantRoutes);
routes.use(webHooksRoutes);
routes.use(adminRoutes);
routes.use(facebookRoutes);
routes.use(kanbanRoutes);
routes.use(ticketProtocolRoutes);
routes.use(ticketEvaluationRoutes);
routes.use(privateMessageRoutes);
routes.use(groupRoutes);
routes.use(todoListRoutes);
routes.use(ticketNotesRoutes);
routes.use(bulkRoutes);
routes.use(banListRoutes);
routes.use(groupsRoutes);
routes.use(wordListRoutes);
routes.use(ghostListRoutes);
routes.use(greetingMessageRoutes);
routes.use(farewellMessageRoutes);
routes.use(farewellPrivateMessageRoutes);
routes.use(participantsListRoutes);
routes.use(groupListLinkRoute);
routes.use(wabaMetaRoutes);
routes.use(smsRoutes);
routes.use(tenantApiRoutes);
routes.use(pm2Routes);
routes.use(terminalRoutes);
routes.use(customRoutes);
routes.use(notificationRoutes);
routes.use(publicRoutes);
routes.use(bullQueueRoutes);
routes.use(hubChannelRoutes);
routes.use(hubMessageRoutes);
routes.use(hubWebhookRoutes);
routes.use(rdStationRoutes);
routes.use(meowWebhookRoutes);
routes.use(meowMessageRoutes);
routes.use(asaasRoutes);
routes.use(planRoutes);

export default routes; 