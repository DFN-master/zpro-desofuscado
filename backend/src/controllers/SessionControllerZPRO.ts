import { Request, Response } from 'express';
import AppError from '../errors/AppErrorZPRO';
import AuthUserService from '../services/AuthUserServiceZPRO';
import { SendRefreshToken } from '../helpers/SendRefreshTokenZPRO';
import { RefreshTokenService } from '../services/RefreshTokenServiceZPRO';
import { getIO } from '../libs/socketZPRO';
import User from '../models/UserZPRO';

interface StoreRequestBody {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  username: string;
  email: string;
  profile: string;
  status: string;
  userId: number;
  tenantId: number;
  queues: any;
  usuariosOnline: any[];
  configs: any;
}

export const store = async (req: Request, res: Response): Promise<Response> => {
  const io = getIO();
  const { email, password } = req.body as StoreRequestBody;

  const { token, user, refreshToken, usuariosOnline } = await AuthUserService({
    email,
    password
  });

  SendRefreshToken(res, refreshToken);

  const response: AuthResponse = {
    token,
    username: user.name,
    email: user.email,
    profile: user.profile,
    status: user.status,
    userId: user.id,
    tenantId: user.tenantId,
    queues: user.queues,
    usuariosOnline,
    configs: user.configs
  };

  io.emit(`${response.tenantId}:users`, {
    action: 'update',
    data: {
      username: response.username,
      email: response.email,
      isOnline: true,
      lastLogin: new Date()
    }
  });

  return res.status(200).json(response);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const oldRefreshToken = req.cookies.jrt;

  if (!oldRefreshToken) {
    throw new AppError('ERR_USER_NOT_FOUND', 404);
  }

  const { newToken, refreshToken } = await RefreshTokenService(oldRefreshToken);

  SendRefreshToken(res, refreshToken);

  return res.json({ token: newToken });
};

export const logout = async (req: Request, res: Response): Promise<Response> => {
  const { userId } = req.body;

  if (!userId) {
    throw new AppError('ERR_SESSION_EXPIRED', 404);
  }

  const io = getIO();
  const user = await User.findByPk(userId);

  if (user) {
    await user.update({
      isOnline: false,
      lastLogout: new Date()
    });
  }

  io.emit(`${user?.tenantId}:users`, {
    action: 'update',
    data: {
      username: user?.name,
      email: user?.email,
      isOnline: false,
      lastLogout: new Date()
    }
  });

  return res.json({ message: 'USER_LOGOUT' });
}; 