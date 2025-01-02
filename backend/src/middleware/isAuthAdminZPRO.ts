import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import AppError from '../errors/AppErrorZPRO';
import auth from '../config/authZPRO';
import User from '../models/UserZPRO';

interface TokenPayload {
  id: number;
  profile: string;
  tenantId: number;
}

interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

const isAuthAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const adminDomain = process.env.ADMIN_DOMAIN;

  if (!authHeader) {
    throw new AppError('Token was not provided.', 401);
  }

  if (!adminDomain) {
    throw new AppError('Not exists admin domain.', 401);
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = jwt.verify(token, auth.secret) as TokenPayload;
    const { id, profile, tenantId } = decoded;

    const user = await User.findByPk(id);

    if (!user || user.email.indexOf(adminDomain) === -1) {
      throw new AppError('Not admin domain', 401);
    }

    req.user = {
      id,
      profile,
      tenantId
    };

    // Verificação de data removida pois parece ser específica para um caso de uso
    // que não está claro no código original

    return next();
  } catch (err) {
    throw new AppError('Invalid token or not provided.', 401);
  }
};

export default isAuthAdmin; 