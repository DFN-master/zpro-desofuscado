import { Request, Response } from 'express';
import * as Yup from 'yup';
import { getIO } from '../libs/socketZPRO';
import ListNotificationService from '../services/NotificationServices/ListNotificationServiceZPRO';
import CreateNotificationService from '../services/NotificationServices/CreateNotificationServiceZPRO';
import ShowNotificationService from '../services/NotificationServices/ShowNotificationServiceZPRO';
import UpdateNotificationService from '../services/NotificationServices/UpdateNotificationServiceZPRO';
import DeleteNotificationService from '../services/NotificationServices/DeleteNotificationServiceZPRO';
import DeleteAllNotificationService from '../services/NotificationServices/DeleteAllNotificationServiceZPRO';
import AppError from '../errors/AppErrorZPRO';
import User from '../models/UserZPRO';
import Tenant from '../models/TenantZPRO';
import axios from 'axios';

interface IndexQuery {
  searchParam?: string;
  pageNumber?: string | number;
}

interface NotificationData {
  message: string;
  userId?: number;
  isRead?: boolean;
}

interface TenantConfig {
  frontendUrl: string;
  backendUrl: string;
  tenantEmail: string;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const { notifications, count, hasMore } = await ListNotificationService({
    searchParam,
    pageNumber
  });

  return res.status(200).json({
    notifications,
    count,
    hasMore
  });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const schema = Yup.object().shape({
    message: Yup.string().required()
  });

  const newNotification = Object.assign({}, req.body);

  try {
    await schema.validate(newNotification);
  } catch (err) {
    throw new AppError(err.message);
  }

  const users = await User.findAll();
  
  const notifications = await Promise.all(
    users.map(user => 
      CreateNotificationService({
        message: newNotification.message,
        userId: user.id,
        tenantId: user.tenantId
      })
    )
  );

  const io = getIO();
  io.emit('notification', {
    action: 'create',
    notifications
  });

  return res.status(200).json(notifications);
};

export const storeN = async (req: Request, res: Response): Promise<Response> => {
  let isValid = true;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ message: 'não_informado' });
  }

  // Validação do token e processamento das notificações
  // ... (mantenha a lógica de validação existente)

  if (!isValid) {
    const tenants = await Tenant.findAll();
    
    for (const tenant of tenants) {
      const tenantId = tenant.id;
      const users = await User.findAll({
        where: { tenantId }
      });

      const notifications = await Promise.all(
        users.map(user => 
          CreateNotificationService({
            message: req.body.message,
            userId: user.id,
            tenantId
          })
        )
      );

      const io = getIO();
      io.emit('notification', {
        action: 'create',
        notifications
      });
    }

    return res.status(200).json('Notifications created');
  }

  return res.status(405).json('ov');
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  const notification = await ShowNotificationService(id);
  return res.status(200).json(notification);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const notificationData: NotificationData = Object.assign({}, req.body);

  const schema = Yup.object().shape({
    message: Yup.string(),
    userId: Yup.number().required(),
    isRead: Yup.boolean()
  });

  try {
    await schema.validate(notificationData);
  } catch (err) {
    throw new AppError(err.message);
  }

  const { id } = req.params;

  const notification = await UpdateNotificationService({
    notificationData,
    notificationId: id
  });

  const io = getIO();
  io.emit('notification', {
    action: 'update',
    notification
  });

  return res.status(200).json(notification);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;
  await DeleteNotificationService(id);

  const io = getIO();
  io.emit('notification', {
    action: 'delete',
    id
  });

  return res.status(200).json({ message: 'Notification deleted' });
};

export const removeAll = async (req: Request, res: Response): Promise<Response> => {
  await DeleteAllNotificationService();

  const io = getIO();
  io.emit('notification', { action: 'deleteAll' });

  return res.status(200).json({ message: 'All notifications deleted' });
}; 