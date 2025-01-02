import * as Yup from 'yup';
import { head } from 'lodash';
import xlsx from 'xlsx';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { Request, Response } from 'express';
import { Op } from 'sequelize';

import ListContactsService from '../services/ContactServices/ListContactsServiceZPRO';
import CreateContactService from '../services/ContactServices/CreateContactServiceZPRO';
import ShowContactService from '../services/ContactServices/ShowContactServiceZPRO';
import ShowContactByNumberService from '../services/ContactServices/ShowContactByNumberServiceZPRO';
import UpdateContactService from '../services/ContactServices/UpdateContactServiceZPRO';
import DeleteContactService from '../services/ContactServices/DeleteContactServiceZPRO';
import UpdateContactTagsService from '../services/ContactServices/UpdateContactTagsServiceZPRO';
import UpdateContactKanbanService from '../services/ContactServices/UpdateContactKanbanServiceZPRO';
import CheckIsValidContact from '../helpers/CheckIsValidContactZPRO';
import GetProfilePicUrl from '../helpers/GetProfilePicUrlZPRO';
import AppError from '../errors/AppErrorZPRO';
import UpdateContactWalletsService from '../services/ContactServices/UpdateContactWalletsServiceZPRO';
import SyncContactsWhatsappInstanceService from '../helpers/SyncContactsWhatsappInstanceServiceZPRO';
import Whatsapp from '../models/WhatsappZPRO';
import { ImportFileContacts } from '../helpers/ImportFileContactsServiceZPRO';
import Contact from '../models/ContactZPRO';
import SyncGroupsWhatsappInstanceService from '../helpers/SyncGroupsWhatsappInstanceServiceZPRO';
import ListContactsKanbanService from '../services/ContactServices/ListContactsKanbanServiceZPRO';
import GetDefaultWhatsApp from '../helpers/GetDefaultWhatsAppZPRO';
import CheckIsValidContactBaileys from '../helpers/BaileysHelpers/CheckIsValidContactBaileysZPRO';
import GetProfilePicUrlBaileys from '../helpers/BaileysHelpers/GetProfilePicUrlBaileysZPRO';
import ListContactsKanbanTagsService from '../services/ContactServices/ListContactsKanbanTagsServiceZPRO';
import ListContactsBirthdayService from '../services/ContactServices/ListContactsBirthdayServiceZPRO';
import ListContactsByTagsService from '../services/ContactServices/ListContactsByTagsServiceZPRO';
import CreateContactServiceVcard from '../services/ContactServices/CreateContactServiceVcardZPRO';
import DeleteDuplicateContacts from '../services/ContactServices/DeleteDuplicateContactsServiceZPRO';
import CheckIsValidContactMeow from '../helpers/MeowHelpers/CheckIsValidContactMeowZPRO';
import GetProfilePicUrlMeow from '../helpers/MeowHelpers/GetProfilePicUrlMeowZPRO';
import { logger } from '../utils/loggerZPRO';

interface ContactData {
  name: string;
  number: string;
  email?: string;
  profilePicUrl?: string;
  tags?: string[];
  wallets?: any[];
  kanban?: string;
}

interface IndexQuery {
  searchParam?: string;
  pageNumber?: string | number;
  walletId?: any;
}

function generateRandomLetters(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  const charsLength = chars.length;
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * charsLength));
  }
  
  return result;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, id: userId, profile } = req.user;
  const { searchParam, pageNumber, walletId } = req.query as IndexQuery;
  
  const walletIdParam = walletId?.id;

  const { contacts, count, hasMore } = await ListContactsService({
    searchParam,
    pageNumber,
    tenantId,
    profile,
    userId,
    walletId: walletIdParam
  });

  return res.json({ contacts, count, hasMore });
};

export const indexByTags = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, id: userId, profile } = req.user;
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const { contacts, count, hasMore } = await ListContactsByTagsService({
    searchParam,
    pageNumber,
    tenantId, 
    profile,
    userId
  });

  return res.json({ contacts, count, hasMore });
};

export const indexBirthday = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, id: userId, profile } = req.user;
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const { contacts, count, hasMore } = await ListContactsBirthdayService({
    searchParam,
    pageNumber,
    tenantId,
    profile,
    userId
  });

  return res.json({ contacts, count, hasMore });
};

export const indexKanban = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, id: userId, profile } = req.user;
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const { contacts, count, hasMore } = await ListContactsKanbanService({
    searchParam,
    pageNumber,
    tenantId,
    profile,
    userId
  });

  return res.json({ contacts, count, hasMore });
};

export const indexTags = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, id: userId, profile } = req.user;
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const { contacts, count, hasMore } = await ListContactsKanbanTagsService({
    searchParam,
    pageNumber,
    tenantId,
    profile,
    userId
  });

  return res.json({ contacts, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const contactData = req.body as ContactData;
  
  contactData.number = contactData.number.replace('-', '').replace(' ', '');

  let contact;

  const schema = Yup.object().shape({
    name: Yup.string().required()
  });

  try {
    await schema.validate(contactData);
  } catch (err) {
    throw new AppError(err.message);
  }

  const whatsapps = await Whatsapp.findAll({
    where: {
      tenantId,
      status: "CONNECTED",
      type: "waba"
    }
  });

  const baileys = await Whatsapp.findAll({
    where: {
      tenantId,
      status: "CONNECTED",
      type: "baileys"
    }
  });

  if (whatsapps.length > 0) {
    const profilePicUrl = await GetProfilePicUrl(contactData.number, tenantId);
    contact = await CreateContactService({
      ...contactData,
      number: contactData.number,
      profilePicUrl: profilePicUrl || '',
      tenantId
    });
  } else if (baileys.length > 0) {
    const validNumber = await CheckIsValidContactBaileys(contactData.number, baileys[0].id);
    const profilePicUrl = await GetProfilePicUrlBaileys(contactData.number, tenantId);
    
    contact = await CreateContactService({
      ...contactData,
      number: validNumber.replace(/\D/g, ''),
      profilePicUrl,
      tenantId
    });
  } else {
    const validNumber = await CheckIsValidContact(contactData.number, tenantId);
    const profilePicUrl = await GetProfilePicUrl(contactData.number, tenantId);
    
    contact = await CreateContactService({
      ...contactData,
      number: validNumber.body,
      profilePicUrl,
      tenantId
    });
  }

  return res.status(200).json(contact);
};

export const storeVcard = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const contactData = req.body as ContactData;
  
  contactData.number = contactData.number.replace('-', '').replace(' ', '');

  let contact;

  const schema = Yup.object().shape({
    name: Yup.string().required(),
    number: Yup.string().required().matches(/^\d+$/, 'Invalid number format. Only numbers is allowed.')
  });

  try {
    await schema.validate(contactData);
  } catch (err) {
    throw new AppError(err.message);
  }

  const whatsapps = await Whatsapp.findAll({
    where: {
      tenantId,
      status: "CONNECTED",
      type: "waba"
    }
  });

  const baileys = await Whatsapp.findAll({
    where: {
      tenantId,
      status: "CONNECTED",
      type: "baileys"
    }
  });

  if (whatsapps.length > 0) {
    const profilePicUrl = await GetProfilePicUrl(contactData.number, tenantId);
    contact = await CreateContactServiceVcard({
      ...contactData,
      number: contactData.number,
      profilePicUrl: profilePicUrl || '',
      tenantId
    });
  }

  if (baileys.length > 0) {
    const validNumber = await CheckIsValidContactBaileys(contactData.number, baileys[0].id);
    const profilePicUrl = await GetProfilePicUrlBaileys(contactData.number, tenantId);
    
    contact = await CreateContactServiceVcard({
      ...contactData,
      number: validNumber.replace(/\D/g, ''),
      profilePicUrl,
      tenantId
    });
  }

  if (whatsapps.length <= 0 && baileys.length <= 0) {
    const validNumber = await CheckIsValidContact(contactData.number, tenantId);
    const profilePicUrl = await GetProfilePicUrl(contactData.number, tenantId);
    
    contact = await CreateContactServiceVcard({
      ...contactData,
      number: validNumber.body,
      profilePicUrl,
      tenantId
    });
  }

  return res.status(200).json(contact);
};

export const showProfilePicture = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { number } = req.body;

  const defaultWhatsapp = await GetDefaultWhatsApp(tenantId);
  let validNumber;

  if (defaultWhatsapp.type === "baileys") {
    validNumber = await CheckIsValidContactBaileys(number, defaultWhatsapp.id);
  } else if (defaultWhatsapp.type === "meow") {
    validNumber = await CheckIsValidContactMeow(number, defaultWhatsapp.id);
  } else {
    validNumber = await CheckIsValidContact(number, tenantId);
  }

  if (!validNumber) {
    throw new AppError("PROFILE PICTURE IS NOT AVAIBLE");
  }

  let profilePicUrl;

  if (defaultWhatsapp.type === "baileys") {
    profilePicUrl = await GetProfilePicUrlBaileys(number, defaultWhatsapp.id);
  } else if (defaultWhatsapp.type === "meow") {
    profilePicUrl = await GetProfilePicUrlMeow(number, defaultWhatsapp.id);
  } else {
    profilePicUrl = await GetProfilePicUrl(number, tenantId);
  }

  return res.status(200).json(profilePicUrl);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { contactId } = req.params;
  const { tenantId } = req.user;

  const contact = await ShowContactService({
    id: contactId,
    tenantId
  });

  return res.status(200).json(contact);
};

export const showNumber = async (req: Request, res: Response): Promise<Response> => {
  const { numberId } = req.params;
  const { tenantId } = req.user;

  const contact = await ShowContactByNumberService({
    number: numberId,
    tenantId
  });

  return res.status(200).json(contact);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const contactData = req.body as ContactData;
  const { tenantId } = req.user;
  const { contactId } = req.params;

  let contact;

  const schema = Yup.object().shape({
    name: Yup.string()
  });

  try {
    await schema.validate(contactData);
  } catch (err) {
    throw new AppError(err.message);
  }

  const whatsapps = await Whatsapp.findAll({
    where: {
      tenantId,
      status: "CONNECTED",
      type: "waba"
    }
  });

  const baileys = await Whatsapp.findAll({
    where: {
      tenantId,
      status: "CONNECTED",
      type: "baileys"
    }
  });

  if (whatsapps.length > 0) {
    contact = await UpdateContactService({
      contactData,
      contactId,
      tenantId
    });
  } else if (baileys.length > 0) {
    if (contactData.number !== "null" && contactData.number !== '') {
      const validNumber = await CheckIsValidContactBaileys(contactData.number, baileys[0].id);
      contactData.number = validNumber.replace(/\D/g, '');
      contact = await UpdateContactService({
        contactData,
        contactId,
        tenantId
      });
    } else {
      contactData.number = "nulo_" + generateRandomLetters(10);
      contact = await UpdateContactService({
        contactData,
        contactId,
        tenantId
      });
    }
  } else {
    if (contactData.number !== "null" && contactData.number !== '') {
      const validNumber = await CheckIsValidContact(contactData.number, tenantId);
      contactData.number = validNumber.body;
      contact = await UpdateContactService({
        contactData,
        contactId,
        tenantId
      });
    } else {
      contact = await UpdateContactService({
        contactData,
        contactId,
        tenantId
      });
    }
  }

  if (contactData.kanban !== undefined) {
    await UpdateContactKanbanService({
      contactId: parseInt(contactId, 10),
      kanban: contactData.kanban
    });
  }

  return res.status(200).json(contact);
};

export const removeDuplicate = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  const contacts = await DeleteDuplicateContacts({
    tenantId
  });

  return res.status(200).json(contacts);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { contactId } = req.params;
  const { tenantId } = req.user;

  await DeleteContactService({
    id: contactId,
    tenantId
  });

  return res.status(200).json({ message: "Contact deleted." });
};

export const updateContactTags = async (req: Request, res: Response): Promise<Response> => {
  const { tags } = req.body;
  const { contactId } = req.params;
  const { tenantId } = req.user;

  const contact = await UpdateContactTagsService({
    tags,
    contactId,
    tenantId
  });

  return res.status(200).json(contact);
};

export const updateContactWallet = async (req: Request, res: Response): Promise<Response> => {
  const { wallets } = req.body;
  const { contactId } = req.params;
  const { tenantId } = req.user;

  const contact = await UpdateContactWalletsService({
    wallets,
    contactId,
    tenantId
  });

  return res.status(200).json(contact);
};

export const syncContacts = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  const whatsapps = await Whatsapp.findAll({
    where: {
      tenantId,
      status: "CONNECTED",
      type: {
        [Op.or]: ["baileys", "baileys"]
      }
    }
  });

  if (!whatsapps.length) {
    throw new AppError("Não existem sessões ativas para sincronização dos contatos");
  }

  await Promise.all(
    whatsapps.map(async whatsapp => {
      if (whatsapp.id) {
        if (whatsapp.type === "baileys") {
          await SyncContactsWhatsappInstanceService(whatsapp.id, +tenantId);
        } else {
          logger.warn(":::: Z-PRO :::: Sync contacts BAILEYS");
          ImportFileContacts(whatsapp.id, +tenantId);
        }
      }
    })
  );

  return res.status(200).json({ message: "Contatos estão sendo sincronizados." });
};

export const syncGroups = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  const whatsapps = await Whatsapp.findAll({
    where: {
      tenantId,
      status: "CONNECTED",
      type: {
        [Op.or]: ["baileys", "baileys"]
      }
    }
  });

  if (!whatsapps.length) {
    throw new AppError("Não existem sessões ativas para sincronização dos contatos");
  }

  await Promise.all(
    whatsapps.map(async whatsapp => {
      if (whatsapp.id) {
        await SyncGroupsWhatsappInstanceService(whatsapp.id, +tenantId, whatsapp.type);
      }
    })
  );

  return res.status(200).json({ message: "Contatos estão sendo sincronizados." });
};

export const exportContacts = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  const contacts = await Contact.findAll({
    where: { tenantId },
    attributes: [
      'id',
      'name',
      'number',
      'email',
      'cpf',
      'dateContact',
      'birthdayDate',
      'day',
      'businessName'
    ],
    order: [['name', 'ASC']],
    raw: true
  });

  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.json_to_sheet(contacts);
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Contatos');

  const buffer = xlsx.write(workbook, {
    bookType: 'xlsx',
    type: 'buffer'
  });

  const fileName = uuidv4() + '_contatos.xlsx';
  const folderPath = path.join(__dirname, '..', '..', 'public', tenantId.toString(), 'downloads');
  const filePath = path.join(folderPath, fileName);

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  fs.writeFile(filePath, buffer, err => {
    if (err) {
      logger.warn(":::: ZDG :::: Erro ao exportar contatos", err);
      return res.status(500).throw(":::: ZDG :::: Erro ao salvar arquivo:");
    }

    const { BACKEND_URL } = process.env;
    const downloadUrl = `${BACKEND_URL}:${process.env.PROXY_PORT}/public/${tenantId}/downloads/${fileName}`;

    res.json({ downloadLink: downloadUrl });
  });
}; 