import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import Tenant from '../../models/TenantZPRO';
import logger from '../../utils/loggerZPRO';

const publicFolder = path.resolve(__dirname, '..', '..', '..', 'public');
const mkdirAsync = promisify(fs.mkdir);
const existsAsync = promisify(fs.exists);

async function createFolders(): Promise<void> {
  try {
    const tenants = await Tenant.findAll();

    for (const tenant of tenants) {
      const tenantPath = path.resolve(publicFolder, tenant.id.toString());
      
      logger.info(`:::Z-PRO:::Checking folder for tenant ${tenant.id} in ${tenantPath}`);

      if (!(await existsAsync(tenantPath))) {
        logger.info(`:::Z-PRO:::Folder for tenant ${tenant.id} does not exist. Creating...`);
        
        await mkdirAsync(tenantPath, { recursive: true });
        
        logger.info(`:::Z-PRO:::Folder created for tenant ${tenant.id}`);
      } else {
        logger.info(`:::Z-PRO:::Folder already exists for tenant ${tenant.id}`);
      }
    }

    logger.info(':::Z-PRO:::Folder creation complete!');
  } catch (error) {
    logger.warn(`:::Z-PRO:::Error creating folders: ${error}`);
  }
}

export default createFolders; 