import { Router } from 'express';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as AutoReplyController from '../controllers/AutoReplyControllerZPRO';
import * as StepsReplyController from '../controllers/StepsReplyControllerZPRO';
import * as StepsReplyActionController from '../controllers/StepsReplyActionControllerZPRO';

const autoReplyRoutes = Router();

// Rotas para Auto Reply
autoReplyRoutes.post('/auto-reply', isAuthZPRO, AutoReplyController.store);
autoReplyRoutes.get('/auto-reply', isAuthZPRO, AutoReplyController.index);
autoReplyRoutes.put('/auto-reply/:idAutoReply', isAuthZPRO, AutoReplyController.update);
autoReplyRoutes.delete('/auto-reply/:idAutoReply', isAuthZPRO, AutoReplyController.remove);

// Rotas para Steps Reply
autoReplyRoutes.post('/auto-reply/steps', isAuthZPRO, StepsReplyController.store);
autoReplyRoutes.put('/auto-reply/steps/:stepsReplyId', isAuthZPRO, StepsReplyController.update);
autoReplyRoutes.delete('/auto-reply/steps/:stepsReplyId', isAuthZPRO, StepsReplyController.remove);

// Rotas para Steps Reply Action
autoReplyRoutes.post('/auto-reply-action', isAuthZPRO, StepsReplyActionController.store);
autoReplyRoutes.put('/auto-reply-action/:actionId', isAuthZPRO, StepsReplyActionController.update);
autoReplyRoutes.delete('/auto-reply-action/:actionId', isAuthZPRO, StepsReplyActionController.remove);

export default autoReplyRoutes; 