import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { logger } from '../../utils/loggerZPRO';

// Convertendo funções do fs para promises
const readdirAsync = promisify(fs.readdir);
const unlinkAsync = promisify(fs.unlink);
const statAsync = promisify(fs.stat);
const rmdirAsync = promisify(fs.rmdir);

// Definindo o caminho da pasta public
const publicFolder = path.resolve(__dirname, '..', '..', '..', 'public');

async function deleteFolderContents(folderPath: string): Promise<void> {
  try {
    const files = await readdirAsync(folderPath);

    for (const file of files) {
      const filePath = path.resolve(folderPath, file);
      const stat = await statAsync(filePath);

      if (stat.isFile()) {
        await unlinkAsync(filePath);
        logger.info(`::: Z-PRO ::: File deleted: ${filePath}`);
      } else if (stat.isDirectory()) {
        await deleteFolderContents(filePath);
        await rmdirAsync(filePath);
        logger.info(`::: Z-PRO ::: Folder deleted: ${filePath}`);
      }
    }
  } catch (error) {
    logger.error(
      `::: Z-PRO ::: Error cleaning folder contents: ${folderPath}`,
      error
    );
  }
}

export async function deleteTenantFolderContents(tenantId: string): Promise<void> {
  try {
    const tenantPath = path.resolve(publicFolder, tenantId);
    const stat = await statAsync(tenantPath);

    if (!stat.isDirectory()) {
      logger.warn(
        `::: Z-PRO ::: ${tenantPath} is not a directory.`
      );
      return;
    }

    await deleteFolderContents(tenantPath);
    logger.info(
      `::: Z-PRO ::: All contents of tenant folder ${tenantId} have been deleted, but the folder remains.`
    );
  } catch (error) {
    logger.error(
      `::: Z-PRO ::: Error cleaning contents of tenant folder: ${tenantId}`,
      error
    );
  }
} 