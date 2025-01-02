import { Request, Response } from 'express';
import ImportContactsServiceZPRO from '../services/ImportContactsServiceZPRO';

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: number;
  };
}

export const store = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  await ImportContactsServiceZPRO(tenantId);

  return res.status(200).json({
    message: "contacts imported"
  });
}; 