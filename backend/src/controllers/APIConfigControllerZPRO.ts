import * as Yup from 'yup';
import { Request, Response } from 'express';
import AppErrorZPRO from '../errors/AppErrorZPRO';

import CreateApiConfigServiceZPRO from '../services/ApiConfigServices/CreateApiConfigServiceZPRO';
import ListApiConfigServiceZPRO from '../services/ApiConfigServices/ListApiConfigServiceZPRO';
import UpdateApiConfigServiceZPRO from '../services/ApiConfigServices/UpdateApiConfigServiceZPRO';
import DeleteApiConfigServiceZPRO from '../services/ApiConfigServices/DeleteApiConfigServiceZPRO';
import RenewApiConfigTokenServiceZPRO from '../services/ApiConfigServices/RenewApiConfigTokenServiceZPRO';

interface IStoreRequest {
  name: string;
  sessionId: number;
  urlServiceStatus?: string;
  urlMessageStatus?: string;
  userId: number;
  tenantId: number;
}

interface IUpdateRequest extends IStoreRequest {
  isActive: boolean;
  apiId: number;
}

interface IRenewTokenRequest {
  sessionId: number;
  userId: number;
  tenantId: number;
  apiId: number;
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, id } = req.params;
  
  if (req.params.profile !== 'admin' && req.params.profile !== 'super') {
    throw new AppErrorZPRO('ERR_NO_PERMISSION', 403);
  }

  const data = {
    ...req.body,
    userId: id,
    tenantId
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
  } catch (err: any) {
    throw new AppErrorZPRO(err.message);
  }

  const apiConfig = await CreateApiConfigServiceZPRO(data);
  return res.status(200).json(apiConfig);
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.params;

  if (req.params.profile !== 'admin' && req.params.profile !== 'super') {
    throw new AppErrorZPRO('ERR_NO_PERMISSION', 403);
  }

  const apiConfigs = await ListApiConfigServiceZPRO({ tenantId });
  return res.status(200).json(apiConfigs);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  if (req.params.profile !== 'admin' && req.params.profile !== 'super') {
    throw new AppErrorZPRO('ERR_NO_PERMISSION', 403);
  }

  const { tenantId, id } = req.params;
  const { apiId } = req.body;

  const data = {
    ...req.body,
    userId: id,
    tenantId
  };

  const schema = Yup.object().shape({
    name: Yup.string().required(),
    sessionId: Yup.number().required(),
    urlServiceStatus: Yup.string().nullable().optional(),
    urlMessageStatus: Yup.string().nullable().optional(),
    userId: Yup.number().required(),
    tenantId: Yup.number().required(),
    isActive: Yup.boolean().required()
  });

  try {
    await schema.validate(data);
  } catch (err: any) {
    throw new AppErrorZPRO(err.message);
  }

  const apiConfig = await UpdateApiConfigServiceZPRO({
    apiData: data,
    apiId,
    tenantId
  });

  return res.status(200).json(apiConfig);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  if (req.params.profile !== 'admin' && req.params.profile !== 'super') {
    throw new AppErrorZPRO('ERR_NO_PERMISSION', 403);
  }

  const { tenantId } = req.params;
  const { apiId } = req.body;

  await DeleteApiConfigServiceZPRO({ apiId, tenantId });

  return res.status(200).json({ message: 'API Config Deleted' });
};

export const renewTokenApi = async (req: Request, res: Response): Promise<Response> => {
  if (req.params.profile !== 'admin' && req.params.profile !== 'super') {
    throw new AppErrorZPRO('ERR_NO_PERMISSION', 403);
  }

  const { tenantId, id } = req.params;
  const { apiId } = req.body;

  const data = {
    ...req.body,
    userId: id,
    tenantId
  };

  const schema = Yup.object().shape({
    sessionId: Yup.number().required(),
    userId: Yup.number().required(),
    tenantId: Yup.number().required()
  });

  try {
    await schema.validate(data);
  } catch (err: any) {
    throw new AppErrorZPRO(err.message);
  }

  const apiConfig = await RenewApiConfigTokenServiceZPRO({
    apiId,
    userId: data.userId,
    sessionId: data.sessionId,
    tenantId: data.tenantId
  });

  return res.status(200).json(apiConfig);
}; 