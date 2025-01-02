import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { format } from 'date-fns';
import { logger } from '../utils/loggerZPRO';

interface RequestWithUser {
  user?: {
    tenantId: string;
  };
  APIAuth?: {
    tenantId: string;
  };
}

const publicFolder = path.resolve(__dirname, '..', '..', 'public');

const uploadConfig = {
  directory: publicFolder,
  storage: multer.diskStorage({
    destination: (
      req: RequestWithUser,
      file: Express.Multer.File,
      callback: (error: Error | null, destination: string) => void
    ) => {
      const { tenantId } = req.user || req.APIAuth || {};
      
      logger.info(`::: Z-PRO ::: ZDG ::: Upload Tenant: ${tenantId}`);
      
      const destinationPath = path.resolve(publicFolder, tenantId.toString());

      if (!fs.existsSync(destinationPath)) {
        fs.mkdirSync(destinationPath, { recursive: true });
      }

      callback(null, destinationPath);
    },

    filename: (
      req: RequestWithUser,
      file: Express.Multer.File,
      callback: (error: Error | null, filename: string) => void
    ) => {
      let finalFilename: string;

      if (file.mimetype?.toLowerCase().endsWith('xml')) {
        finalFilename = file.originalname;
      } else {
        const { originalname } = file;
        const fileExtension = path.extname(originalname);
        const fileName = originalname
          .replace(fileExtension, '')
          .replace(/\s+/g, '_')
          .replace(/[^\w.-]/g, '');
        
        const dateStamp = format(new Date(), 'ddMMyyyyHHmmssSSS');
        finalFilename = `${fileName}_${dateStamp}${fileExtension}`;
      }

      callback(null, finalFilename);
    }
  })
};

export default uploadConfig; 