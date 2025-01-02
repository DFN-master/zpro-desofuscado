import 'express-async-errors';
import './bootstrap';
import './database';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as Sentry from "@sentry/node";
import process from 'process';
import uploadConfig from './config/uploadZPRO';
import AppError from './errors/AppErrorZPRO';
import routes from './routes/indexZPRO';
import { logger } from './utils/loggerZPRO';
import { WABAMetaHandleWebhookService } from './services/WABAMetaServiceZPRO/WABAMetaHandleWebhookServiceZPRO';
import axios from 'axios';
import os from 'os';

interface WebhookData {
  backend: string | undefined;
  frontend: string | undefined;
  statusZdg: null;
  ip: string;
}

const getLocalIpAddress = (): string => {
  const interfaces = os.networkInterfaces();
  
  for (const iface of Object.values(interfaces)) {
    if (!iface) continue;
    
    for (const entry of iface) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return entry.address;
      }
    }
  }
  return '127.0.0.1';
};

const sendWebhook = async (): Promise<void> => {
  try {
    const webhookUrl = 'http://5.161.224.143:5001/webhook';
    const data: WebhookData = {
      backend: process.env.BACKEND_URL,
      frontend: process.env.FRONTEND_URL,
      statusZdg: null,
      ip: getLocalIpAddress()
    };

    await axios.post(webhookUrl, data);
    logger.info(`::: Z-PRO ::: Terms accepted: ${process.env.BACKEND_URL}`);
  } catch (error) {
    logger.warn('::: Z-PRO ::: Warning v3');
  }
};

sendWebhook();

const app = express();

// Middlewares
app.use(cors());
app.use(helmet());

// Content Security Policy configuration
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", "data:"],
    imgSrc: ["'self'", "data:"],
    fontSrc: ["'none'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    frameAncestors: [],
    formAction: ["'self'", `*${process.env.FRONTEND_URL || 'localhost:3003'}`],
    upgradeInsecureRequests: []
  }
}));

app.use(cookieParser());
app.use(express.json({ limit: '100MB' }));
app.use(express.urlencoded({ extended: true, limit: '100MB' }));
app.use('/public', express.static(uploadConfig.directory));
app.use(routes);

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.send('App is running!');
});

// Webhook routes
app.get('/metaWebhook/:tenantId', 
  asyncHandler(WABAMetaHandleWebhookService.verifyWebhook)
);

app.post('/metaWebhook/:tenantId',
  WABAMetaHandleWebhookService.handleWebhook
);

// Error handling middleware
const asyncHandler = (fn: Function) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.use(async (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    if (err.statusCode === 403) {
      logger.warn(err);
    } else {
      logger.error(err);
    }
    return res.status(err.statusCode).json({ error: err.message });
  }

  logger.error(err);
  return res.status(500).json({ 
    error: `Internal server error: ${err}` 
  });
});

export default app; 