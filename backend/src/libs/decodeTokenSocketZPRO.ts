import { verify } from 'jsonwebtoken';
import authConfig from '../config/authZPRO';
import logger from '../utils/loggerZPRO';

interface DecodedToken {
  id: string;
  profile: string;
  tenantId: number;
}

interface DecodeResponse {
  isValid: boolean;
  data: DecodedToken;
}

const decode = (token: string): DecodeResponse => {
  const logMessage = ':::: Z-PRO :::: ZDG :::: JsonWebToken';
  
  const defaultResponse: DecodeResponse = {
    isValid: false,
    data: {
      id: '',
      profile: '',
      tenantId: 0
    }
  };

  try {
    const decoded = verify(token, authConfig.secret) as DecodedToken;
    
    const { id, profile, tenantId } = decoded;
    
    return {
      isValid: true,
      data: {
        id,
        profile,
        tenantId
      }
    };
    
  } catch (error) {
    logger.info(logMessage);
    return defaultResponse;
  }
};

export default decode; 