interface AuthConfig {
  secret: string;
  expiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}

const authConfig: AuthConfig = {
  secret: process.env.JWT_SECRET || 'My45kIlU7nSQ0G1MJPoQaR',
  expiresIn: '2d',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'nhXeIcXugtIeq3PVf25Eu9',
  refreshExpiresIn: '5d'
};

export default authConfig; 