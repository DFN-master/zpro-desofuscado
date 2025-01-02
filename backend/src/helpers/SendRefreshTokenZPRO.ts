import { Response } from 'express';

interface CookieOptions {
  httpOnly: boolean;
}

export const SendRefreshToken = (res: Response, token: string): void => {
  const cookieOptions: CookieOptions = {
    httpOnly: true
  };

  res.cookie('jrt', token, cookieOptions);
};

export default SendRefreshToken; 