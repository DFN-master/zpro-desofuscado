import http from 'http';
import gracefulShutdown from 'http-graceful-shutdown';
import app from './app';
import { initIO } from './libs/socket';
import { StartAllWhatsAppsSessions } from './services/WbotServices/StartAllWhatsAppsSessions';
import { logger } from './utils/logger';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { createBullBoard } from '@bull-board/api';
import { ExpressAdapter } from '@bull-board/express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import Queue from './libs/Queue';
import basicAuth from 'basic-auth';
import { Request, Response, NextFunction } from 'express';

// Configuração do adaptador do Bull Board
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

const PORT = process.env.PORT || '3000';

// Middleware de autenticação
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const credentials = basicAuth(req);

  if (!credentials || credentials.pass !== process.env.FRONTEND_USER) {
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).send('Access denied');
  }

  next();
};

// Inicialização e processamento das filas
export async function initializeAndProcessQueues(): Promise<void> {
  try {
    await Queue.initialize();

    createBullBoard({
      queues: Queue.queues.map(queue => new BullAdapter(queue.bull)),
      serverAdapter
    });

  } catch (error) {
    console.error('Erro ao inicializar filas Bull:', error);
  }
}

// Processamento das filas
export async function processQueues(): Promise<void> {
  try {
    Queue.process();
  } catch (error) {
    console.error('Erro ao processar filas Bull:', error);
  }
}

// Inicialização do servidor
const server = app.listen(PORT, async () => {
  await initializeAndProcessQueues();

  const promises = [];
  const whatsappInit = StartAllWhatsAppsSessions();
  promises.push(whatsappInit);

  Promise.all(promises).then(async () => {
    logger.info('Processando filas Bull');
    processQueues();
  });

  logger.info(`Server started on port: ${PORT}`);
});

// Configuração das rotas e middlewares
app.use('/admin/queues', authMiddleware, serverAdapter.getRouter());

// Inicialização do socket.io
initIO(server);

// Configuração do shutdown gracioso
gracefulShutdown(server); 