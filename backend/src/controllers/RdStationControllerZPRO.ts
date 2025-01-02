import { Request, Response } from 'express';
import { RdStationCRMServiceZPRO } from '../services/RdStation/RdStationCRMServiceZPRO';

interface ContactPayload {
  name?: string;
  email?: string;
  job_title?: string;
  bio?: string;
  website?: string;
  personal_phone?: string;
  mobile_phone?: string;
  city?: string;
  state?: string;
  country?: string;
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  tags?: string[];
  legal_bases?: Array<{
    category: string;
    type: string;
    status: string;
  }>;
  custom_fields?: {
    [key: string]: string | number | boolean;
  };
}

interface ErrorResponse {
  error: string;
}

class RDStationController {
  public async getContacts(
    req: Request,
    res: Response<ContactPayload[] | ErrorResponse>
  ): Promise<Response> {
    const { apiToken } = req.body;

    try {
      const contacts = await RdStationCRMServiceZPRO.getContacts(apiToken);
      return res.status(200).json(contacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return res.status(500).json({ error: 'Error fetching contacts' });
    }
  }

  public async createContact(
    req: Request,
    res: Response<ContactPayload | ErrorResponse>
  ): Promise<Response> {
    const { apiToken, payload } = req.body;

    try {
      const contact = await RdStationCRMServiceZPRO.createContact(
        apiToken,
        payload as ContactPayload
      );
      return res.status(201).json(contact);
    } catch (error) {
      console.error('Error creating contact:', error);
      return res.status(500).json({ error: 'Error creating contact' });
    }
  }

  public async updateContact(
    req: Request,
    res: Response<ContactPayload | ErrorResponse>
  ): Promise<Response> {
    const { apiToken, payload } = req.body;
    const { id } = req.params;

    try {
      const contact = await RdStationCRMServiceZPRO.updateContact(
        apiToken,
        id,
        payload as ContactPayload
      );
      return res.status(200).json(contact);
    } catch (error) {
      console.error('Error updating contact:', error);
      return res.status(500).json({ error: 'Error updating contact' });
    }
  }

  public async deleteContact(
    req: Request,
    res: Response<void | ErrorResponse>
  ): Promise<Response> {
    const { apiToken } = req.body;
    const { id } = req.params;

    try {
      await RdStationCRMServiceZPRO.deleteContact(apiToken, id);
      return res.status(200).send();
    } catch (error) {
      console.error('Error deleting contact:', error);
      return res.status(500).json({ error: 'Error deleting contact' });
    }
  }
}

export default new RDStationController(); 