import { Request, Response } from 'express';
import * as Yup from 'yup';
import { getIO } from '../libs/socket';
import ListTenantApiService from '../services/TenantApi/ListTenantApiServiceZPRO';
import CreateTenantApiService from '../services/TenantApi/CreateTenantApiServiceZPRO';
import ShowTenantApiService from '../services/TenantApi/ShowTenantApiServiceZPRO';
import UpdateTenantApiService from '../services/TenantApi/UpdateTenantApiServiceZPRO';
import DeleteTenantApiService from '../services/TenantApi/DeleteTenantApiServiceZPRO';
import DeleteAllTenantApiService from '../services/TenantApi/DeleteAllTenantApiServiceZPRO';
import AppError from '../errors/AppErrorZPRO';
import CreateTenantService from '../services/TenantServices/CreateTenantServiceZPRO';
import CreateUserService from '../services/UserServices/CreateUserServiceZPRO';
import UpdateTenanStatusService from '../services/TenantServices/UpdateTenanStatusServiceZPRO';
import CreateApiConfigService from '../services/ApiConfigServices/CreateApiConfigServiceZPRO';
import Whatsapp from '../models/WhatsappZPRO';
import User from '../models/UserZPRO';

interface IndexQuery {
  searchParam?: string;
  pageNumber?: string | number;
  tenantId?: number | string;
}

interface StoreData {
  name: string;
  status: string;
  maxUsers: number;
  maxConnections: number;
  email: string;
  password: string;
  userName: string;
  profile: string;
}

interface UpdateData {
  apiToken: string;
  tenantId: number;
}

interface StoreApiData {
  name: string;
  sessionId: number;
  urlServiceStatus?: string;
  urlMessageStatus?: string;
  userId: number;
  tenantId: number;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;
  const { tenantId } = req.user;

  const { tenantApi, count, hasMore } = await ListTenantApiService({
    searchParam,
    pageNumber,
    tenantId
  });

  return res.json({
    tenantApi,
    count,
    hasMore
  });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  const schema = Yup.object().shape({
    apiToken: Yup.string().required(),
    tenantId: Yup.number().required()
  });

  const data = {
    ...req.body,
    userId: req.user.id,
    tenantId
  };

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const tenantApi = await CreateTenantApiService(data);

  return res.status(200).json(tenantApi);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { tenantApiId } = req.params;
  const tenantApi = await ShowTenantApiService(tenantApiId);

  return res.status(200).json(tenantApi);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const data: UpdateData = {
    ...req.body,
    userId: req.user.id,
    tenantId
  };

  const schema = Yup.object().shape({
    apiToken: Yup.string()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const { tenantApiId } = req.params;

  const tenantApi = await UpdateTenantApiService({
    tenantApiData: data,
    tenantApiId
  });

  const io = getIO();
  io.emit("tenantApi", {
    action: "update",
    tenantApi
  });

  return res.status(200).json(tenantApi);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { tenantApiId } = req.params;

  await DeleteTenantApiService(tenantApiId, tenantId);

  const io = getIO();
  io.emit("tenantApi", {
    action: "delete",
    tenantApiId
  });

  return res.status(200).json({ message: "Tenant Api deleted" });
};

export const removeAll = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  
  await DeleteAllTenantApiService(tenantId);

  const io = getIO();
  io.emit("tenantApi", {
    action: "delete"
  });

  return res.status(200).json({ message: "All Tenant Api deleted" });
};

export const storeTenant = async (req: Request, res: Response): Promise<Response> => {
  const tenantData: StoreData = { ...req.body };
  const userData = { ...req.body };

  const schema = Yup.object().shape({
    status: Yup.string().required(),
    name: Yup.string().required(),
    maxUsers: Yup.number().required(),
    maxConnections: Yup.number().required()
  });

  try {
    await schema.validate(tenantData);
  } catch (err) {
    throw new AppError(err.message);
  }

  const tenant = await CreateTenantService(tenantData);

  const userSchema = Yup.object().shape({
    email: Yup.string().required(),
    password: Yup.string().required(),
    userName: Yup.string().required(),
    profile: Yup.string().required(),
    tenantId: Yup.string().required()
  });

  try {
    await userSchema.validate(tenantData);
  } catch (err) {
    throw new AppError(err.message);
  }

  const user = await CreateUserService({
    ...userData,
    userName: req.body.userName,
    profile: req.body.profile || "admin",
    tenantId: tenant.id
  });

  return res.status(200).json({
    tenant,
    user
  });
};

export const updateTenant = async (req: Request, res: Response): Promise<Response> => {
  const data = { ...req.body };
  const { identity } = req.body;

  const tenant = await UpdateTenanStatusService({
    tenantData: data,
    identity
  });

  return res.status(200).json(tenant);
};

export const storeApi = async (req: Request, res: Response): Promise<Response> => {
  const data: StoreApiData = {
    ...req.body,
    tenantId: req.body.tenant
  };

  const schema = Yup.object().shape({
    name: Yup.string().required(),
    sessionId: Yup.number().required(),
    urlServiceStatus: Yup.string().nullable().optional(),
    urlMessageStatus: Yup.string().nullable().optional(),
    userId: Yup.number().required(),
    tenantId: Yup.number().required()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const whatsapp = await Whatsapp.findOne({
    where: { id: req.body.sessionId }
  });

  const user = await User.findOne({
    where: { id: req.body.userId }
  });

  if (whatsapp?.tenantId !== req.body.tenant || user?.tenantId !== req.body.tenant) {
    return res.status(400).json("Usuário ou Sessão não estão associados a tenant Id");
  }

  const apiConfig = await CreateApiConfigService(data);

  return res.status(200).json(apiConfig);
}; 