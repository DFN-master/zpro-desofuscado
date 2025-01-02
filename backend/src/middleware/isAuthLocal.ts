import { Request, Response, NextFunction } from 'express';
import WhatsappZPRO from '../models/WhatsappZPRO';

interface CustomRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    profile: string;
  };
  params: {
    wabaId: string;
  };
}

const setUser = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const { wabaId } = req.params;

  const whatsapp = await WhatsappZPRO.findOne({
    where: { wabaId }
  });

  if (!whatsapp) {
    return res.status(404).json({
      message: 'Whatsapp channel not found'
    });
  }

  req.user = {
    id: whatsapp.tenantId.toString(),
    tenantId: whatsapp.tenantId,
    profile: 'admin'
  };

  next();
};

export default setUser; 