import express, { Router } from 'express';
import multer from 'multer';
import isAuthZPRO from '../middleware/isAuthZPRO';
import * as ContactController from '../controllers/ContactControllerZPRO';
import * as ImportPhoneContactsController from '../controllers/ImportPhoneContactsControllerZPRO';
import uploadConfig from '../config/uploadZPRO';

const upload = multer(uploadConfig);
const contactRoutes = Router();

// Rotas de importação
contactRoutes.post('/contactsSync', isAuthZPRO, ImportPhoneContactsController.store);
contactRoutes.post('/contactsVcard', isAuthZPRO, upload.array('file'), ContactController.store);
contactRoutes.post('/contactsKanban', isAuthZPRO, ContactController.storeVcard);

// Rotas de listagem
contactRoutes.get('/contacts', isAuthZPRO, ContactController.index);
contactRoutes.get('/contactsTags/:contactId', isAuthZPRO, ContactController.indexKanban);
contactRoutes.get('/contact-tags', isAuthZPRO, ContactController.indexByTags);
contactRoutes.get('/contact-tags', isAuthZPRO, ContactController.indexTags);
contactRoutes.get('/contactsDay', isAuthZPRO, ContactController.indexBirthday);
contactRoutes.get('/contacts/:contactId', isAuthZPRO, ContactController.show);
contactRoutes.get('/contactsNumber/:number', isAuthZPRO, ContactController.showNumber);

// Rotas de atualização
contactRoutes.post('/contact-wallet/:contactId', isAuthZPRO, ContactController.updateContactWallet);
contactRoutes.post('/contacts', isAuthZPRO, ContactController.store);
contactRoutes.post('/contactsDeletDuplicate', isAuthZPRO, ContactController.removeDuplicate);
contactRoutes.post('/contactsShare/isAuthenticate', isAuthZPRO, ContactController.syncGroups);
contactRoutes.post('/contactsSync', isAuthZPRO, ContactController.syncContacts);
contactRoutes.post('/groups/sync', isAuthZPRO, ContactController.sync);

// Rotas de modificação
contactRoutes.put('/contacts/:contactId', isAuthZPRO, ContactController.update);
contactRoutes.delete('/contacts/:contactId', isAuthZPRO, ContactController.remove);
contactRoutes.put('/contactsBirthday', isAuthZPRO, ContactController.showProfile);
contactRoutes.put('/contactsShowProfile', isAuthZPRO, ContactController.showPicture);

export default contactRoutes; 