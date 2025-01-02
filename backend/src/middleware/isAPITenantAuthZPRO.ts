import { Request, Response, NextFunction } from 'express';
import TenantApiZPRO from '../models/TenantApiZPRO';
import AppErrorZPRO from '../errors/AppErrorZPRO';

interface CustomRequest extends Request {
  body: {
    tenantId: string;
    [key: string]: any;
  }
}

const validateApiToken = async (
  req: CustomRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppErrorZPRO('Authorization header is required', 401);
  }

  const [, apiToken] = authHeader.split(' ');

  if (!apiToken) {
    throw new AppErrorZPRO('API token is required', 401);
  }

  // Validação de data de expiração
  const currentDate = new Date();
  const expirationDate = new Date('2025-02-01'); // Data fixa de expiração

  if (currentDate > expirationDate) {
    throw new AppErrorZPRO('API token expired', 401);
  }

  // Busca o tenant pelo token
  const tenant = await TenantApiZPRO.findOne({
    where: {
      apiToken
    }
  });

  if (!tenant) {
    throw new AppErrorZPRO('Invalid API token', 401);
  }

  // Adiciona o tenantId ao body da requisição
  req.body.tenantId = tenant.tenantId;

  next();
};

export default validateApiToken; 