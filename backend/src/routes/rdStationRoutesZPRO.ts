import { Router } from 'express';
import RdStationControllerZPRO from '../controllers/RdStation/RdStationControllerZPRO';

const router = Router();

// Rotas para gerenciamento de contatos do RD Station
router.get('/contacts', RdStationControllerZPRO.getContacts);
router.post('/contacts', RdStationControllerZPRO.createContact);
router.put('/contacts/:id', RdStationControllerZPRO.updateContact);
router.delete('/contacts/:id', RdStationControllerZPRO.deleteContact);

export default router; 