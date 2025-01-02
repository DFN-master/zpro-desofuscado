import express, { Router } from 'express';
import multer from 'multer';
import { 
  handleIconUpload,
  handleLogoUpload,
  handleAppNameUpdate 
} from '../controllers/UploadControllerZPRO';
import {
  handleBuild,
  handleCleanTenant,
  handleMigrateTenant,
  handleDeleteTenantFolder,
  handleGetTenantFolder
} from '../controllers/BuildControllerZPRO';
import isAuthZPRO from '../middleware/isAuthZPRO';

const router: Router = express.Router();

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// Rotas de Upload
router.post('/custom/uploadIcon', 
  upload.single('file'),
  isAuthZPRO,
  handleIconUpload
);

router.post('/custom/uploadLogo',
  upload.single('file'),
  isAuthZPRO,
  handleLogoUpload
);

router.post('/custom/updateName',
  isAuthZPRO,
  handleAppNameUpdate
);

// Rotas de Build e Gerenciamento
router.post('/custom/migrate',
  isAuthZPRO,
  handleMigrateTenant
);

router.post('/custom/build',
  isAuthZPRO,
  handleBuild
);

router.post('/custom/clean',
  isAuthZPRO,
  handleCleanTenant
);

router.post('/custom/deleteTenantFolder',
  isAuthZPRO,
  handleDeleteTenantFolder
);

router.post('/custom/getTenantFolder',
  isAuthZPRO,
  handleGetTenantFolder
);

export default router; 