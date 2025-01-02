import { Request, Response } from 'express';
import { buildFrontend } from '../services/BuildServiceZPRO';
import AppError from '../errors/AppErrorZPRO';
import { logger } from '../utils/loggerZPRO';
import { migrateFolders } from '../services/MigrateFilesZPRO';
import { cleanPublicFolder } from '../services/DeleteFilesZPRO';
import { deleteTenantFolder } from '../services/DeleteTenantFilesZPRO';
import { getTenantFolderSize } from '../services/CalculateTenantFilesZPRO';

export const handleBuild = (req: Request, res: Response): void => {
  if (req.user.profile !== 'superadmin') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  buildFrontend((error, output, errorMessage) => {
    if (error) {
      logger.warn(':::: Z-PRO :::: Build error:', errorMessage);
      res.sendStatus(400);
      return;
    }
    logger.warn(':::: Z-PRO :::: Build output:', output);
    res.sendStatus(200);
  });
};

export const handleMigrate = (req: Request, res: Response): void => {
  if (req.user.profile !== 'superadmin') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  try {
    migrateFolders();
  } catch (error) {
    logger.warn(':::: Z-PRO :::: Error migrating files:', error);
  }
  res.sendStatus(200);
};

export const handleClean = (req: Request, res: Response): void => {
  if (req.user.profile !== 'superadmin') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  try {
    cleanPublicFolder();
  } catch (error) {
    logger.warn(':::: Z-PRO :::: Error cleaning files:', error);
  }
  res.sendStatus(200);
};

export const handleDeleteTenantFolder = async (req: Request, res: Response): Promise<void> => {
  if (req.user.profile !== 'superadmin') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const tenantId = Object.keys(req.body)[0];
  if (!tenantId) {
    throw new AppError('ERR_TENANT_ID_REQUIRED', 400);
  }

  try {
    await deleteTenantFolder(tenantId.toString());
    logger.info(':::: Z-PRO :::: Tenant folder deleted successfully: ' + tenantId);
    res.sendStatus(200);
  } catch (error) {
    logger.error(':::: Z-PRO :::: Error deleting tenant folder for tenant: ' + tenantId, error);
    res.status(500).json({ error: 'Error deleting tenant folder' });
  }
};

export const handleGetTenantFolderSize = async (req: Request, res: Response): Promise<void> => {
  if (req.user.profile !== 'superadmin') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const tenantId = Object.keys(req.body)[0];
  if (!tenantId) {
    throw new AppError('ERR_TENANT_ID_REQUIRED', 400);
  }

  try {
    const folderSize = await getTenantFolderSize(tenantId.toString());
    logger.info(`:::: Z-PRO :::: Tenant folder size fetched for ${tenantId}: ${folderSize.toFixed(2)} MB`);
    
    res.status(200).json({
      tenantId,
      folderSizeMB: folderSize.toFixed(2)
    });
  } catch (error) {
    logger.error(`:::: Z-PRO :::: Error fetching folder size for tenant ${tenantId}`, error);
    res.status(500).json({ error: 'Error fetching folder size' });
  }
}; 