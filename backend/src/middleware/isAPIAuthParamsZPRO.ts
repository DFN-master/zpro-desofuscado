import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import AppErrorZPRO from '../errors/AppErrorZPRO';
import authZPRO from '../config/authZPRO';

interface TokenPayload {
  apiId: string;
  sessionId: string;
  tenantId: number;
}

interface AuthenticatedRequest extends Request {
  APIAuth?: {
    apiId: string;
    sessionId: string;
    tenantId: number;
  };
}

const isAPIAuthParams = (
  req: AuthenticatedRequest,
  _: Response,
  next: NextFunction
): void => {
  const { bearertoken } = req.query;

  if (!bearertoken || typeof bearertoken !== 'string') {
    throw new AppErrorZPRO('Token was not provided.', 401);
  }

  try {
    const decoded = jwt.verify(bearertoken, authZPRO.secret) as TokenPayload;
    
    const { apiId, sessionId, tenantId } = decoded;
    
    req.APIAuth = {
      apiId,
      sessionId,
      tenantId
    };

    // Verificação de data de expiração
    const currentDate = new Date();
    const expirationDate = new Date('2025-02-01');

    if (currentDate > expirationDate) {
      throw new AppErrorZPRO('Token expired or invalid.', 401);
    }

  } catch (err) {
    throw new AppErrorZPRO('Invalid token.', 401);
  }

  return next();
};

export default isAPIAuthParams; 