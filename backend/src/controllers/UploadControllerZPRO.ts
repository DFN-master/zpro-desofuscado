import { Request, Response } from 'express';
import { uploadLogoService } from '../services/UploadServices/UploadLogoServiceZPRO';
import { uploadIconService } from '../services/UploadServices/UploadIconServiceZPRO';
import { updateAppName } from '../services/UpdateServices/UpdateNameServiceZPRO';
import { uploadUpdateFile, unzipUpdateFile, runUpdateCommands } from '../services/UploadServices/UploadUpdateZPRO';
import { AppError } from '../errors/AppErrorZPRO';
import { logger } from '../utils/loggerZPRO';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    profile: string;
  };
}

export const handleLogoFileUpload = (req: AuthenticatedRequest, res: Response): void => {
  const { tenantId } = req.user;

  if (req.user.profile !== 'superadmin') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const file = req.files.file;

  uploadLogoService(file, (error: Error | null) => {
    if (error) {
      logger.warn('Z-PRO ::: Upload file error:', error);
      res.sendStatus(400);
      return;
    }
    res.sendStatus(200);
  });
};

export const handleIconFileUpload = (req: AuthenticatedRequest, res: Response): void => {
  const { tenantId } = req.user;

  if (req.user.profile !== 'superadmin') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const file = req.files.file;

  uploadIconService(file, (error: Error | null) => {
    if (error) {
      logger.warn('ZDG ::: Upload file error:', error);
      res.sendStatus(400);
      return;
    }
    res.sendStatus(200);
  });
};

export const handleAppNameUpdate = (req: AuthenticatedRequest, res: Response): void => {
  if (req.user.profile !== 'superadmin') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const newAppName = req.body.newAppName;
  
  if (!newAppName) {
    throw new AppError('ERR_INVALID_INPUT', 400);
  }

  updateAppName(newAppName, (error: Error | null) => {
    if (error) {
      logger.warn('ZDG ::: Update app name error:', error);
      res.sendStatus(400);
      return;
    }
    res.sendStatus(200);
  });
};

export const handleUpdateFileUpload = (req: AuthenticatedRequest, res: Response): void => {
  const { tenantId } = req.user;

  if (req.user.profile !== 'superadmin') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const file = req.files.file;

  uploadUpdateFile(file, (error: Error | null) => {
    if (error) {
      logger.warn('ZDG ::: Upload update file error:', error);
      res.sendStatus(400);
      return;
    }
    logger.warn('ZDG ::: Upload update file successful');
    res.sendStatus(200);
  });
};

export const handleUpdateProcess = (req: AuthenticatedRequest, res: Response): void => {
  if (req.user.profile !== 'superadmin') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  unzipUpdateFile((error: Error | null) => {
    if (error) {
      logger.warn(`ZDG ::: Unzip update file error: ${error}`);
      res.sendStatus(400);
      return;
    }

    runUpdateCommands((error: Error | null, stdout: string, stderr: string) => {
      if (error) {
        logger.warn(`ZDG ::: Run update commands error: ${error} :: stderr: ${stderr}`);
        res.sendStatus(400);
        return;
      }
      logger.warn(`ZDG ::: Run update commands output: ${stdout}`);
      res.sendStatus(200);
    });
  });
}; 