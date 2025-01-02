import { Request, Response } from 'express';
import { UpdateContactTagsService } from '../services/UpdateContactTagsServiceZPRO';
import { ApiConfig } from '../models/ApiConfigZPRO';
import { ShowWhatsAppService } from '../services/ShowWhatsAppServiceZPRO';
import { DeleteWhatsAppService } from '../services/DeleteWhatsAppServiceZPRO';
import AppError from '../errors/AppErrorZPRO';

interface UpdateTagRequest {
  body: {
    tagId: number;
  };
  params: {
    tenantId: number;
  };
}

interface DeleteSessionRequest {
  params: {
    tenantId: number;
    sessionId: string;
  };
  query: {
    apiId: number;
  };
  body: {
    whatsappId: string;
  };
}

interface ContactUpdateData {
  name?: string;
  email?: string;
  number?: string;
  phone?: string;
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  youtube?: string;
}

export const updateTag = async (req: UpdateTagRequest, res: Response): Promise<Response> => {
  const { tagId } = req.body;
  const { tenantId } = req.params;

  const contact = await Contact.findOne({ /* critérios de busca */ });

  if (contact?.id) {
    await UpdateContactTagsService({
      tags: [tagId],
      contactId: contact.id.toString(),
      tenantId
    });
  }

  return res.status(200).json(contact);
};

export const deleteSession = async (req: DeleteSessionRequest, res: Response): Promise<Response> => {
  const { tenantId, sessionId } = req.params;
  const { apiId } = req.query;

  const api = await ApiConfig.findOne({
    where: {
      id: apiId,
      tenantId
    }
  });

  if (api?.sessionId !== sessionId) {
    throw new AppError('ERR_TICKET_NOT_AUTHORIZED', 400);
  }

  const { whatsappId } = req.body;
  
  const whatsapp = await ShowWhatsAppService({
    id: whatsappId,
    tenantId: api.tenantId
  });

  await DeleteWhatsAppService(whatsapp.id.toString(), whatsapp.tenantId);

  return res.status(200).json(whatsapp);
};

export const updateContact = async (req: Request, res: Response): Promise<Response> => {
  const contact = await Contact.findOne({ /* critérios de busca */ });

  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  const allowedFields: (keyof ContactUpdateData)[] = [
    'name',
    'email', 
    'number',
    'phone',
    'whatsapp',
    'facebook',
    'instagram',
    'linkedin',
    'twitter',
    'youtube'
  ];

  const updateData: ContactUpdateData = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  await contact.update(updateData);

  return res.status(200).json({
    status: 'success',
    contact
  });
}; 