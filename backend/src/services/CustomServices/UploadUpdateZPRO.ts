import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import unzipper from 'unzipper';
import dotenv from 'dotenv';
import { logger } from '../../utils/loggerZPRO';

dotenv.config();

// Constantes de ambiente
const PROJECT_ROOT = process.env.PROJECT_ROOT || path.join(__dirname, '..', '..', '..', '..');
const DEPLOY_PATH = process.env.DEPLOY_PATH || path.join(PROJECT_ROOT);
const BACKEND_DIR = process.env.BACKEND_DIR || 'backend';
const FRONTEND_DIR = process.env.FRONTEND_DIR || 'frontend';
const BACKEND_PATH = path.join(DEPLOY_PATH, BACKEND_DIR);
const FRONTEND_PATH = path.join(DEPLOY_PATH, FRONTEND_DIR);
const UPDATE_PATH = path.join(PROJECT_ROOT, 'update_rapido.zip');

interface UpdateCallback {
  (error: Error | null, stdout?: string, stderr?: string): void;
}

// Upload do arquivo de atualização
const uploadUpdateFile = (tempFilePath: string, callback: (error: Error | null) => void): void => {
  const copyFileAndCleanup = (source: string, destination: string, cb: (error: Error | null) => void) => {
    fs.copyFile(source, destination, (copyError) => {
      if (copyError) return cb(copyError);

      fs.unlink(source, (unlinkError) => {
        if (unlinkError) {
          console.error('Erro ao remover o arquivo temporário:', unlinkError.message);
        }
        cb(null);
      });
    });
  };

  copyFileAndCleanup(tempFilePath, UPDATE_PATH, callback);
};

// Descompactar arquivo de atualização
const unzipUpdateFile = (callback: (error: Error | null) => void): void => {
  logger.info(':::: Z-PRO :::: Unzip update...');

  fs.createReadStream(UPDATE_PATH)
    .pipe(unzipper.Extract({ path: DEPLOY_PATH }))
    .on('close', () => {
      logger.info(':::: Z-PRO :::: Extract complete');
      
      fs.unlink(UPDATE_PATH, (error) => {
        if (error) return callback(error);
        callback(null);
      });
    })
    .on('error', (error) => {
      callback(error);
    });
};

// Executar comandos de atualização
const runUpdateCommands = (callback: UpdateCallback): void => {
  const updateCommand = `chmod +x ${BACKEND_PATH}/update.sh && \
  cd ${BACKEND_PATH} && \
  echo "Dependencies installing..." && \
  ./update.sh && \
  echo "Dependencies installed."`;

  logger.info(':::: Z-PRO :::: Running commands:', updateCommand);

  exec(updateCommand, { cwd: PROJECT_ROOT }, (error, stdout, stderr) => {
    if (error) {
      logger.error('Error running commands', error);
    }
    if (stdout) {
      console.log('Output:', stdout);
    }
    if (stderr) {
      console.error('Error output:', stderr);
    }
    callback(error, stdout, stderr);
  });
};

export {
  uploadUpdateFile,
  unzipUpdateFile,
  runUpdateCommands
}; 