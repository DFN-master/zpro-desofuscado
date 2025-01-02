import * as fsp from 'fs/promises';
import path from 'path';
import * as fs from 'fs';
import { logger } from '../utils/logger';

interface AddLogsParams {
  fileName: string;
  text: string;
  forceNewFile?: boolean;
}

export async function addLogs({
  fileName,
  text,
  forceNewFile = false
}: AddLogsParams): Promise<void> {
  const logsDir = path.resolve(__dirname, '..', '..', 'logs');
  const logPath = path.resolve(logsDir, fileName);

  try {
    // Cria diretório de logs se não existir
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }

    if (forceNewFile) {
      await fsp.writeFile(logPath, `${text} \n`);
      logger.warn(
        `::: Z-PRO ::: ZDG ::: Novo Arquivo de log adicionado ${logPath} : ${text}`
      );
    } else {
      await fsp.appendFile(logPath, `${text} \n`);
      logger.info(
        `::: Z-PRO ::: ZDG ::: Texto adicionado ao arquivo de log ${logPath} : ${text}`
      );
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Se arquivo não existe, cria novo
      await fsp.writeFile(logPath, `${text} \n`);
      logger.warn(
        `::: Z-PRO ::: ZDG ::: Novo Arquivo de log adicionado ${logPath} : ${text}`
      );
    } else {
      logger.warn('::: Z-PRO ::: ZDG ::: Erro ao manipular arquivo de log:', error);
    }
  }
} 