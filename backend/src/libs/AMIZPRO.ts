import AsteriskManager from 'asterisk-manager';
import { logger } from '../utils/loggerZPRO';

interface AmiConfig {
  port: string;
  host: string;
  username: string;
  password: string;
  keepConnected: boolean;
}

interface OriginateOptions {
  action: string;
  context: string;
  channel: string;
  exten: string;
  priority: number;
  variable: {
    LINENAME: string;
    LINENUM: string;
  };
}

// Configuração do AMI
const amiConfig: AmiConfig = {
  port: '5038',
  host: '192.168.20.6.50',
  username: 'admin',
  password: 'start123',
  keepConnected: true
};

// Inicializa conexão com Asterisk Manager Interface
const ami = new AsteriskManager(
  amiConfig.port,
  amiConfig.host,
  amiConfig.username,
  amiConfig.password,
  amiConfig.keepConnected
);

// Conecta ao AMI
ami.keepConnected();

// Listener para eventos de conexão
ami.on('connect', (data: any) => {
  console.log(
    ':::: Z-PRO :::: Emitindo mensagem de desligamento da chamada:\n\n',
    JSON.stringify(data),
    '\n\n\n'
  );
});

// Configuração para originar chamada
const originateOptions: OriginateOptions = {
  action: 'Dial',
  context: 'from-internal',
  channel: 'SIP/4815',
  exten: 'CID:4815',
  priority: 1,
  variable: {
    LINENAME: '0991191708',
    LINENUM: 'CID:4815'
  }
};

// Origina chamada
ami.originate(originateOptions, (err: Error, res: any) => {
  logger.warn(':::: Z-PRO :::: action', err, res);
});

// Listener para eventos de resposta
ami.on('response', (data: any) => {
  logger.warn(':::: Z-PRO :::: response', data);
});

// Listener para eventos de hangup
ami.on('hangup', (data: any) => {
  logger.warn(':::: Z-PRO :::: hangup', data);
});

export default ami; 