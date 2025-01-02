import dotenv from 'dotenv';
import { config } from 'dotenv';

interface ConfigOptions {
  path: string;
}

// Configura as variáveis de ambiente baseado no ambiente de execução
const configOptions: ConfigOptions = {
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env'
};

// Carrega as variáveis de ambiente do arquivo apropriado
config(configOptions);

export {}; 