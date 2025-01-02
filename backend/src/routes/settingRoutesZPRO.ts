import { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as SettingController from '../controllers/SettingControllerZPRO';

const settingRoutes = Router();

// Rotas para configurações ZPRO
settingRoutes.get('/settings', isAuthZPRO, SettingController.index);

settingRoutes.get('/settings/:settingKey', isAuthZPRO, SettingController.show);

settingRoutes.put('/settings/:settingKey', isAuthZPRO, SettingController.update);

export default settingRoutes; 