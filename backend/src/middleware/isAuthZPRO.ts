import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import AppErrorZPRO from '../errors/AppErrorZPRO';
import authConfig from '../config/authZPRO';

interface TokenPayload {
  id: string;
  profile: string;
  tenantId: string;
}

interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

const isAuth = (
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> | void => {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw new AppErrorZPRO('Token was not provided.', 401);
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = jwt.verify(token, authConfig.secret) as TokenPayload;

    const { id, profile, tenantId } = decoded;

    request.user = {
      id,
      profile,
      tenantId
    };

    // Verificação de data de expiração personalizada
    const currentDate = new Date();
    const expirationDate = new Date('2025-02-01');

    if (currentDate > expirationDate) {
      const message = 'É necessário realizar a atualização do funcionamento para o desenvolvimento.';
      throw new AppErrorZPRO(message, 401);
    }

  } catch (error) {
    throw new AppErrorZPRO('Invalid token.', 401);
  }

  return next();
};

export default isAuth; 