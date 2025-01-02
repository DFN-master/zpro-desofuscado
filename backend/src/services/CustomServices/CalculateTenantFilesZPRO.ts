import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { logger } from '../../utils/loggerZPRO';

// Convertendo funções do fs para versões com Promise
const readdirAsync = promisify(fs.readdir);
const statAsync = promisify(fs.stat);

// Definindo o caminho da pasta public
const publicFolder = path.resolve(__dirname, '..', '..', '..', 'public');

/**
 * Calcula o tamanho total de uma pasta em bytes
 * @param directoryPath Caminho da pasta a ser calculada
 * @returns Promise com o tamanho total em bytes
 */
async function getFolderSize(directoryPath: string): Promise<number> {
  let totalSize = 0;

  try {
    const files = await readdirAsync(directoryPath);

    for (const file of files) {
      const filePath = path.resolve(directoryPath, file);
      const stats = await statAsync(filePath);

      if (stats.isFile()) {
        totalSize += stats.size;
      } else if (stats.isDirectory()) {
        totalSize += await getFolderSize(filePath);
      }
    }
  } catch (error) {
    logger.error(
      `::: Z-PRO ::: Error reading folder size for directory: ${directoryPath}`,
      error
    );
    throw error;
  }

  return totalSize;
}

/**
 * Calcula o tamanho da pasta de um tenant específico em megabytes
 * @param tenant Nome do tenant
 * @returns Promise com o tamanho da pasta em MB
 */
async function getTenantFolderSize(tenant: string): Promise<number> {
  try {
    const tenantPath = path.resolve(publicFolder, tenant);
    const stats = await statAsync(tenantPath);

    if (!stats.isDirectory()) {
      throw new Error(`The path ${tenantPath} is not a directory`);
    }

    const folderSizeInBytes = await getFolderSize(tenantPath);
    const folderSizeInMB = folderSizeInBytes / (1024 * 1024); // Convertendo bytes para MB

    return folderSizeInMB;
  } catch (error) {
    logger.error(
      `::: Z-PRO ::: Error calculating folder size for tenant: ${tenant}`,
      error
    );
    throw new Error(
      `Failed to calculate folder size for tenant: ${tenant}`
    );
  }
}

export { getTenantFolderSize }; 