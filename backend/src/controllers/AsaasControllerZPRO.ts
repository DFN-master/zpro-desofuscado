import { Request, Response } from 'express';
import * as Yup from 'yup';
import { AppError } from '../errors/AppErrorZPRO';
import { logger } from '../utils/loggerZPRO';
import User from '../models/UserZPRO';
import { ShowAsaasToken } from '../services/ShowAsaasTokenZPRO';
import { CreateTenantService } from '../services/CreateTenantServiceZPRO';
import { CreateUserService } from '../services/CreateUserServiceZPRO';
import { AsaasCreateClientService } from '../services/AsaasCreateClientServiceZPRO';
import { AsaasCreateSubscriptionService } from '../services/AsaasCreateSubscriptionServiceZPRO';
import { AsaasDeleteClientService } from '../services/AsaasDeleteClientServiceZPRO';
import { AsaasListSubscriptionService } from '../services/AsaasListSubscriptionServiceZPRO';
import { AsaasUpdateSubscriptionService } from '../services/AsaasUpdateSubscriptionServiceZPRO';

interface TenantData {
  status: string;
  name: string;
  maxUsers: number;
  maxConnections: number;
  email: string;
  password: string;
  userName: string;
  profile: string;
}

interface UserData {
  email: string;
  password: string;
  name: string;
  profile: string;
  tenantId: string;
}

const validateTenantData = async (data: TenantData): Promise<void> => {
  const schema = Yup.object().shape({
    status: Yup.string().required('Status é obrigatório.'),
    name: Yup.string().required('Nome é obrigatório'),
    maxUsers: Yup.number().required('Número máximo de usuários é obrigatório.'),
    maxConnections: Yup.number().required('Número máximo de conexões é obrigatório.')
  });

  await schema.validate(data, { abortEarly: false });
};

const validateUserData = async (data: UserData): Promise<void> => {
  const schema = Yup.object().shape({
    email: Yup.string().email('E-mail inválido.').required('E-mail é obrigatório.'),
    password: Yup.string().required('Senha é obrigatória'),
    name: Yup.string().required('Nome de usuário é obrigatório.'),
    profile: Yup.string().required('Perfil é obrigatório.'),
    tenantId: Yup.string().required('Tenant ID é obrigatório.')
  });

  await schema.validate(data, { abortEarly: false });
};

export const createClient = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {
      status,
      name,
      maxUsers,
      maxConnections,
      email,
      password,
      userName,
      profile
    } = req.body;

    const asaasToken = await ShowAsaasToken();
    
    if (!asaasToken) {
      throw new AppError('Gateway de pagamento não foi configurado.', 400);
    }

    const userExists = await User.findOne({
      where: { email }
    });

    if (userExists) {
      throw new AppError('Usuário já existe', 400);
    }

    const asaasClient = await AsaasCreateClientService(asaasToken, req.body);
    
    const tenantData = {
      ...req.body,
      customerId: asaasClient.id
    };

    const asaasSubscription = await AsaasCreateSubscriptionService(asaasToken, tenantData);

    if (!asaasSubscription) {
      throw new AppError('Erro ao criar assinatura', 400);
    }

    const tenantParams = {
      status,
      name,
      maxUsers,
      maxConnections,
      acceptTerms: true,
      trial: 'enabled',
      asaasToken,
      asaasCustomerId: asaasClient.id,
      customer: 'disabled'
    };

    const userData = {
      email,
      password,
      profile: profile || 'admin',
      tenantId: '',
      name: userName
    };

    await validateTenantData(tenantParams);
    const tenant = await CreateTenantService(tenantParams);

    userData.tenantId = tenant.id.toString();
    await validateUserData(userData);
    const user = await CreateUserService(userData);

    return res.status(200).json({
      asaasClient,
      asaasSubscription,
      tenant,
      user
    });

  } catch (err) {
    logger.error('Erro ao criar cliente', err);
    return res.status(400).json({ error: err.message });
  }
};

export const createSubscription = async (req: Request, res: Response): Promise<Response> => {
  try {
    const asaasToken = await ShowAsaasToken();
    const subscriptionData = req.body;
    const subscription = await AsaasCreateSubscriptionService(asaasToken, subscriptionData);
    return res.status(200).json(subscription);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

export const deleteClient = async (req: Request, res: Response): Promise<Response> => {
  if (req.user.profile !== 'admin') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  try {
    const asaasToken = await ShowAsaasToken();
    const { clientId } = req.params;
    const response = await AsaasDeleteClientService(asaasToken, clientId);
    return res.status(200).json(response);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

export const listSubscriptions = async (req: Request, res: Response): Promise<Response> => {
  if (req.user.profile !== 'admin' && req.user.profile !== 'admin') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  try {
    const asaasToken = await ShowAsaasToken();
    const { customerId } = req.query;
    const subscriptions = await AsaasListSubscriptionService(asaasToken, customerId);
    return res.status(200).json(subscriptions);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

export const updateSubscription = async (req: Request, res: Response): Promise<Response> => {
  if (req.user.profile !== 'admin' && req.user.profile !== 'admin') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  try {
    const asaasToken = await ShowAsaasToken();
    const { subscriptionId } = req.params;
    const subscriptionData = req.body;
    const subscription = await AsaasUpdateSubscriptionService(asaasToken, subscriptionId, subscriptionData);
    return res.status(200).json(subscription);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}; 