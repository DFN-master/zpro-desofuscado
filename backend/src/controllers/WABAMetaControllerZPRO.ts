import { Request, Response } from 'express';
import { WhatsappZPRO } from '../models/WhatsappZPRO';
import { AppErrorZPRO } from '../errors/AppErrorZPRO';
import { GetWABAMetaTemplateServiceZPRO } from '../services/GetWABAMetaTemplateServiceZPRO';

interface ITemplateVariable {
  [key: string]: string;
}

function substituteVariables(text: string, variables: string[]): string {
  let result = text;
  variables.forEach((value, index) => {
    const placeholder = `{{${index + 1}}}`;
    result = result.replace(placeholder, value);
  });
  return result;
}

export const showTemplate = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { tokenApi } = req.headers;

  const whatsapp = await WhatsappZPRO.findOne({
    where: {
      tokenApi,
      tenantId
    }
  });

  if (!whatsapp) {
    throw new AppErrorZPRO("WhatsApp não encontrado para este tenant", 404);
  }

  const getTemplateService = new GetWABAMetaTemplateServiceZPRO();
  const templates = await getTemplateService.execute({ whatsapp });

  return res.status(200).json(templates);
};

interface IMessageComponent {
  type: string;
  [key: string]: any;
}

interface ITemplateMessage {
  type: string;
  components?: IMessageComponent[];
}

export const sendTemplateMessageComponents = async (req: Request, res: Response): Promise<Response> => {
  // Implementação do envio de template individual
  return res.status(200).json({ success: true });
};

export const sendBulkTemplateMessageComponents = async (req: Request, res: Response): Promise<Response> => {
  // ... código para envio em massa
  
  const processMediaComponent = (component: any): IMessageComponent => {
    const mediaTypes = ['image', 'video', 'document'];
    
    if (mediaTypes.includes(component.type.toLowerCase())) {
      return {
        type: component.type.toLowerCase(),
        [component.type.toLowerCase()]: { link: component.url }
      };
    }
    
    if (component.type === 'AUDIO') {
      return {
        type: 'audio',
        url: component.url
      };
    }
    
    return {} as IMessageComponent;
  };

  // ... resto da implementação do envio em massa
  
  return res.status(200).json({ success: true });
};

interface IMessageData {
  cpf: string;
  birthdayDate: string;
  user: string;
  userEmail: string;
}

export const sendMessage = async (req: Request, res: Response): Promise<Response> => {
  const messageData: IMessageData = {
    cpf: req.user?.profile?.cpf || '',
    birthdayDate: req.user?.profile?.birthdayDate || '',
    user: req.user?.user?.name || '',
    userEmail: req.user?.user?.email || ''
  };

  // Implementação do envio de mensagem
  return res.status(200).json({ success: true });
}; 