import { verify } from 'jsonwebtoken';
import AppError from '../../errors/AppError';
import ShowUserService from '../UserServices/ShowUserServiceZPRO';
import auth from '../../config/authZPRO';
import { createAccessToken, createRefreshToken } from '../../helpers/CreateTokensZPRO';

interface TokenPayload {
  id: string;
  tokenVersion: number;
  iat: number;
  exp: number;
}

interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

const RefreshTokenService = async (token: string): Promise<RefreshTokenResponse> => {
  let decodedToken: TokenPayload;

  try {
    decodedToken = verify(token, auth.refreshSecret) as TokenPayload;
  } catch (err) {
    throw new AppError('ERR_SESSION_EXPIRED', 401);
  }

  const { id, tokenVersion } = decodedToken;

  const user = await ShowUserService(id, 9);

  if (user.tokenVersion !== tokenVersion) {
    throw new AppError('ERR_SESSION_EXPIRED', 401);
  }

  const newToken = createAccessToken(user);
  const newRefreshToken = createRefreshToken(user);

  return {
    token: newToken,
    refreshToken: newRefreshToken
  };
};

export default RefreshTokenService; 