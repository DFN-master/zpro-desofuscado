import { sign } from 'jsonwebtoken';
import authConfig from '../config/authZPRO';

interface User {
  id: string;
  name: string;
  profile: string;
  tenantId: string;
  tokenVersion?: number;
}

interface TokenPayload {
  id: string;
  name?: string;
  profile?: string;
  tenantId?: string;
  tokenVersion?: number;
}

export const createAccessToken = (user: User): string => {
  const { secret, expiresIn } = authConfig;

  const payload: TokenPayload = {
    name: user.name,
    tenantId: user.tenantId,
    profile: user.profile,
    id: user.id
  };

  return sign(payload, secret, { expiresIn });
};

export const createRefreshToken = (user: User): string => {
  const { refreshSecret, refreshExpiresIn } = authConfig;

  const payload: TokenPayload = {
    id: user.id,
    tokenVersion: user.tokenVersion
  };

  return sign(payload, refreshSecret, { expiresIn: refreshExpiresIn });
}; 