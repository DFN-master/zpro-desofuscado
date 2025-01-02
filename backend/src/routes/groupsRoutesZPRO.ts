import { Router } from 'express';
import isAuthZPRO from '../middleware/share/isAuthZPRO';
import multer from 'multer';
import uploadConfig from '../config/uploadZPRO';
import * as GroupSingleController from '../controllers/GroupSingleControllerZPRO';

const groupsRoutes = Router();

// Configuração do multer
const upload = multer({
  ...uploadConfig.default,
  limits: {
    fileSize: 1 * 1024 * 1024  // 1MB
  }
});

// Rotas para gerenciamento de grupos
groupsRoutes.post('/createGroups', isAuthZPRO, GroupSingleController.createGroups);

groupsRoutes.post('/listGroup', isAuthZPRO, GroupSingleController.listGroupIds);

groupsRoutes.post('/listGroupById', isAuthZPRO, GroupSingleController.listGroupById);

groupsRoutes.post('/listGroup', isAuthZPRO, GroupSingleController.listGroup);

groupsRoutes.post('/listGroupIds', isAuthZPRO, GroupSingleController.listGroupIds);

groupsRoutes.post('/listGroupInGroups', isAuthZPRO, GroupSingleController.listGroupInGroups);

groupsRoutes.post('/setAdminsOnlyForGroups', isAuthZPRO, GroupSingleController.setAdminsOnlyForGroups);

groupsRoutes.post('/addParticipantsToGroups', isAuthZPRO, GroupSingleController.addParticipantsToGroups);

groupsRoutes.post('/listParticipantsInGroups', isAuthZPRO, GroupSingleController.listParticipantsInGroups);

groupsRoutes.post('/demoteParticipantsFromGroups', isAuthZPRO, GroupSingleController.demoteParticipantsFromGroups);

groupsRoutes.post('/removeParticipantsFromGroups', isAuthZPRO, GroupSingleController.removeParticipantsFromGroups);

groupsRoutes.post('/promoteParticipantsInGroups', isAuthZPRO, GroupSingleController.promoteParticipantsInGroups);

groupsRoutes.post('/changeDescriptions', isAuthZPRO, GroupSingleController.changeDescriptions);

groupsRoutes.post('/changeTitles', isAuthZPRO, GroupSingleController.changeTitles);

groupsRoutes.post('/changePicturesFile', isAuthZPRO, upload.single('medias'), GroupSingleController.changePicturesFile);

export default groupsRoutes; 