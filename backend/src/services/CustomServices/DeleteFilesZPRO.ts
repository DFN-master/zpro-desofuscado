import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { logger } from '../../utils/loggerZPRO';

// Convertendo callbacks do fs para Promises
const readdirAsync = promisify(fs.readdir);
const unlinkAsync = promisify(fs.unlink);
const statAsync = promisify(fs.stat);

// Definindo o caminho da pasta public
const publicFolder = path.resolve(__dirname, '..', '..', '..', 'public');

/**
 * Limpa arquivos da pasta public mantendo a estrutura de subpastas
 */
export async function cleanPublicFolder(): Promise<void> {
  try {
    // Lê o conteúdo da pasta public
    const files = await readdirAsync(publicFolder);

    // Processa cada arquivo
    for (const file of files) {
      const filePath = path.resolve(publicFolder, file);
      const stat = await statAsync(filePath);

      // Remove apenas arquivos, mantém pastas
      if (stat.isFile()) {
        await unlinkAsync(filePath);
        logger.info(`::: Z-PRO ::: ZDG ::: File deleted: ${filePath}`);
      }
    }

    logger.info(
      '::: Z-PRO ::: ZDG ::: Clean-up of public folder completed. Only subfolders remain intact.'
    );
  } catch (error) {
    logger.error('::: Z-PRO ::: ZDG ::: Error during public folder clean-up:', error);
  }
} 