import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import AppErrorZPRO from '../errors/AppErrorZPRO';
import authZPRO from '../config/authZPRO';

interface TokenPayload {
  apiId: number;
  sessionId: number;
  tenantId: number;
}

interface AuthenticatedRequest extends Request {
  apiAuth?: TokenPayload;
}

const isAPIAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppErrorZPRO('Token was not provided.', 401);
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = jwt.verify(token, authZPRO.secret) as TokenPayload;

    const { apiId, sessionId, tenantId } = decoded;

    req.apiAuth = {
      apiId,
      sessionId,
      tenantId
    };

    // Verificação de data de expiração
    const currentDate = new Date();
    const expirationDate = new Date('2025-02-01');

    if (currentDate > expirationDate) {
      throw new AppErrorZPRO('Realize uma nova atualização.', 401);
    }

  } catch (err) {
    throw new AppErrorZPRO('Invalid token.', 401);
  }

  return next();
};

export default isAPIAuth; 