import { exec } from 'child_process';
import { Request, Response } from 'express';
import { logger } from '../utils/loggerZPRO';
import AppErrorZPRO from '../errors/AppErrorZPRO';

interface PM2Process {
  name: string;
  env: NodeJS.ProcessEnv;
}

export const restartPM2 = (req: Request, res: Response): void => {
  // Verifica se o usuário tem permissão de admin
  if (req.profile.user !== 'admin') {
    throw new AppErrorZPRO('ERR_NO_PERMISSION', 401);
  }

  // Lista todos os processos PM2
  exec('pm2 jlist', { env: process.env }, (error, stdout, stderr) => {
    if (error) {
      logger.warn(
        ':::: ZDG :::: Z-PRO :::: Erro ao listar processos PM2: ' + 
        error.message
      );
      res.status(500).send(
        'Erro ao listar processos PM2: ' + error.message
      );
      return;
    }

    if (stderr) {
      logger.warn(
        ':::: ZDG :::: Z-PRO :::: Stderr ao parsear lista de processos PM2: ' + 
        stderr
      );
      res.status(500).send(
        'Stderr ao listar processos PM2: ' + stderr
      );
      return;
    }

    let processList: PM2Process[];
    
    try {
      processList = JSON.parse(stdout);
    } catch (error) {
      logger.warn(
        ':::: ZDG :::: Z-PRO :::: Erro ao parsear lista de processos PM2: ' + 
        error.message
      );
      res.status(500).send(
        'Erro ao parsear lista de processos PM2: ' + error.message
      );
      return;
    }

    // Extrai os nomes dos processos
    const processNames = processList.map(process => process.name);

    logger.info(
      ':::: ZDG :::: Z-PRO :::: Processos PM2 encontrados: ' + 
      processNames.join(', ')
    );

    // Reinicia cada processo
    processNames.forEach(processName => {
      exec(`pm2 restart ${processName}`, { env: process.env }, 
        (error, stdout, stderr) => {
          if (error) {
            logger.warn(
              ':::: ZDG :::: Z-PRO :::: Erro ao reiniciar processo ' + 
              processName + ': ' + error.message
            );
            return;
          }

          if (stderr) {
            logger.warn(
              ':::: ZDG :::: Z-PRO :::: Stderr ao reiniciar PM2 para ' + 
              processName + ': ' + stderr
            );
            return;
          }

          logger.info(
            ':::: ZDG :::: Z-PRO :::: ' + processName + 
            ' reiniciado com sucesso: ' + stdout
          );
        }
      );
    });

    res.send(
      'Tentativa de reiniciar todos os processos PM2 iniciada'
    );
  });
}; 