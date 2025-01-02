import { Request, Response } from 'express';
import { AppError } from '../errors/AppErrorZPRO';
import { Tenant } from '../models/TenantZPRO';
import { UpdateTenantServiceTransfer } from '../services/UpdateTenantServiceTransferZPRO';
import { UpdateTenantNullTicketsService } from '../services/UpdateTenantNullTicketsServiceZPRO';
import { DeleteTenantService } from '../services/DeleteTenantServiceZPRO';
import { CreateTenantService } from '../services/CreateTenantServiceZPRO';
import { ListTenantService } from '../services/ListTenantServiceZPRO';
import { ListTenantByIdService } from '../services/ListTenantByIdServiceZPRO';
import { UpdateSystemColorsService } from '../services/UpdateSystemColorsServiceZPRO';
import { UpdateBusinessHoursService } from '../services/UpdateBusinessHoursServiceZPRO';
import { ShowBusinessHoursAndMessageService } from '../services/ShowBusinessHoursAndMessageServiceZPRO';
import { UpdateTenantService } from '../services/UpdateTenantServiceZPRO';
import * as Yup from 'yup';
import path from 'path';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import { AsaasPaymentService } from '../services/AsaasPaymentServiceZPRO';

interface UpdateAsaasRequest {
  user: {
    profile: string;
  };
  body: {
    token: string;
  };
}

interface UpdateTransferRequest {
  user: {
    profile: string;
    id: number;
  };
  body: any;
  params: {
    tenantId: number;
  };
}

interface SystemColorsData {
  primaryColor: string;
  secondaryColor: string;
  // adicione outras cores necessárias
}

interface BusinessHoursData {
  schedules: Array<{
    day: string;
    hours: Array<{
      start: string;
      end: string;
    }>;
  }>;
  messageBusinessHours?: string;
}

interface TenantData {
  name?: string;
  status?: boolean;
  maxUsers?: number;
  maxConnections?: number;
  businessHours?: BusinessHoursData;
  messageBusinessHours?: string;
}

export const updateAsaas = async (req: UpdateAsaasRequest, res: Response): Promise<Response> => {
  if (req.user.profile !== 'admin') {
    throw new AppError('Não autorizado', 400);
  }

  const { token } = req.body;
  const tenants = await Tenant.findAll();

  for (const tenant of tenants) {
    await tenant.update({ asaasApiKey: token });
  }

  return res.status(200).json('API Key atualizada com sucesso');
};

export const updateTransfer = async (req: UpdateTransferRequest, res: Response): Promise<Response> => {
  if (req.user.profile !== 'admin' && req.user.profile !== 'supervisor') {
    throw new AppError('Não autorizado', 400);
  }

  const data = {
    ...req.body,
    userId: req.user.id
  };

  const { tenantId } = req.params;

  const updatedTenant = await UpdateTenantServiceTransfer({
    data,
    tenantId,
    userId: req.user.id
  });

  return res.status(200).json(updatedTenant);
};

export const updateNullTickets = async (req: UpdateTransferRequest, res: Response): Promise<Response> => {
  if (req.user.profile !== 'admin' && req.user.profile !== 'supervisor') {
    throw new AppError('Não autorizado', 400);
  }

  const data = {
    ...req.body,
    userId: req.user.id
  };

  const { tenantId } = req.params;

  const result = await UpdateTenantNullTicketsService({
    data,
    tenantId,
    userId: req.user.id
  });

  return res.status(200).json(result);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  if (req.user.profile !== 'admin') {
    throw new AppError('Não autorizado', 400);
  }

  const { tenantId } = req.params;

  await DeleteTenantService({ id: tenantId });

  return res.status(200).json({ message: 'Tenant removido com sucesso' });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  if (req.user.profile !== 'admin') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const data = {
    ...req.body,
    userId: req.user.id
  };

  const schema = Yup.object().shape({
    status: Yup.string().required(),
    name: Yup.string().required(),
    maxUsers: Yup.number().required(),
    maxConnections: Yup.number().required()
  });

  try {
    await schema.validate(data);
  } catch (error) {
    throw new AppError(error.message);
  }

  const tenant = await CreateTenantService(data);
  return res.status(200).json(tenant);
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  if (req.user.profile !== 'admin') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const tenants = await ListTenantService();
  return res.status(200).json(tenants);
};

export const indexAcceptTerms = async (req: Request, res: Response): Promise<Response> => {
  const tenants = await ListTenantService();
  const tenantsFiltered = tenants.map(tenant => ({
    tenantId: tenant.id,
    acceptTerms: tenant.acceptTerms
  }));
  return res.status(200).json(tenantsFiltered);
};

export const indexValidLicense = async (req: Request, res: Response): Promise<Response> => {
  const tenants = await ListTenantService();
  const tenantsFiltered = tenants.map(tenant => ({
    tenantId: tenant.id,
    tenantLicense: tenant.tenantLicense,
    tenantEmail: tenant.tenantEmail
  }));
  return res.status(200).json(tenantsFiltered);
};

export const indexAllAsaas = async (req: Request, res: Response): Promise<Response> => {
  if (req.user.profile !== 'admin') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const tenants = await ListTenantService();
  const asaasInfo = [];

  for (const tenant of tenants) {
    if (tenant.status && tenant.status === 'active') {
      try {
        const paymentInfo = await AsaasPaymentService(
          tenant.asaasToken,
          tenant.asaasCustomerId
        );
        asaasInfo.push({
          tenantId: tenant.id,
          paymentInfo
        });
      } catch (error) {
        logger.warn('Error getting Asaas info:', error);
      }
    }
  }

  return res.status(200).json(asaasInfo);
};

export const indexById = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const tenant = await ListTenantByIdService(tenantId);
  return res.status(200).json(tenant);
};

export const indexEnv = async (req: Request, res: Response): Promise<Response> => {
  if (req.user.profile !== 'admin') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const envPath = path.join(__dirname, '..', '..', '.env');

  try {
    const envFile = await fs.readFile(envPath, 'utf8');
    const envConfig = dotenv.parse(envFile);
    return res.json(envConfig);
  } catch (error) {
    return res.status(500).send('Erro ao ler o arquivo .env');
  }
};

export const indexPackageJson = async (req: Request, res: Response): Promise<Response> => {
  if (req.user.profile !== 'admin') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const packagePath = path.join(__dirname, '..', '..', 'package.json');

  try {
    const packageFile = await fs.readFile(packagePath, 'utf8');
    const packageConfig = JSON.parse(packageFile);
    return res.json(packageConfig);
  } catch (error) {
    return res.status(500).send('Erro ao ler o arquivo package.json');
  }
};

export const indexAsaas = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const tenant = await Tenant.findOne({
    where: { id: tenantId },
    attributes: [['id', 'ASC']]
  });

  if (!tenant) {
    throw new AppError('Tenant não encontrado ou não informado', 404);
  }

  const paymentInfo = await AsaasPaymentService(
    tenant.asaasToken,
    tenant.asaasCustomerId
  );

  return res.status(200).json(paymentInfo);
};

export const updateSystemColors = async (req: Request, res: Response): Promise<Response> => {
  if (req.user.profile !== 'admin' && req.user.profile !== 'supervisor') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const colors: SystemColorsData = req.body;

  const schema = Yup.object().shape({
    primaryColor: Yup.string().required(),
    secondaryColor: Yup.string().required()
  });

  try {
    await schema.validate(colors);
  } catch (error) {
    throw new AppError(error.message);
  }

  const tenants = await Tenant.findAll();

  for (const tenant of tenants) {
    await UpdateSystemColorsService({
      systemColors: colors,
      tenantId: tenant.id
    });
  }

  return res.status(200).json({ message: 'Colors Ok' });
};

export const updateBusinessHours = async (req: Request, res: Response): Promise<Response> => {
  if (req.user.profile !== 'admin' && req.user.profile !== 'supervisor') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const { tenantId } = req.params;
  const businessHours: BusinessHoursData = req.body;

  if (!businessHours) {
    throw new AppError('ERR_NO_MESSAGE_INFORMATION', 404);
  }

  const updatedTenant = await UpdateBusinessHoursService({
    businessHours,
    tenantId
  });

  return res.status(200).json(updatedTenant);
};

export const showBusinessHoursAndMessage = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const businessHours = await ShowBusinessHoursAndMessageService({ tenantId });
  return res.status(200).json(businessHours);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  if (req.user.profile !== 'admin') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const data: TenantData = {
    ...req.body,
    userId: req.user.id
  };

  const schema = Yup.object().shape({
    status: Yup.string().required(),
    name: Yup.string().required(),
    maxUsers: Yup.number().required(),
    maxConnections: Yup.number().required(),
    businessHours: Yup.string().required(),
    messageBusinessHours: Yup.string().required()
  });

  try {
    await schema.validate(data);
  } catch (error) {
    throw new AppError(error.message);
  }

  const { tenantId } = req.params;

  const tenant = await UpdateTenantService({
    data,
    tenantId,
    userId: req.user.id
  });

  return res.status(200).json(tenant);
}; 