import { Request, Response } from 'express';
import * as Yup from 'yup';
import AppError from '../errors/AppErrorZPRO';
import CreateCampaignService from '../services/CampaignServices/CreateCampaignServiceZPRO';
import ListCampaignService from '../services/CampaignServices/ListCampaignServiceZPRO';
import DeleteCampaignService from '../services/CampaignServices/DeleteCampaignServiceZPRO';
import UpdateCampaignService from '../services/CampaignServices/UpdateCampaignServiceZPRO';
import StartCampaignService from '../services/CampaignServices/StartCampaignServiceZPRO';
import CancelCampaignService from '../services/CampaignServices/CancelCampaignServiceZPRO';

interface MediaFile {
  filename: string;
  path: string;
  mimetype: string;
}

interface CampaignData {
  name: string;
  start: string;
  message1: string;
  message2: string;
  message3: string;
  userId: number;
  sessionId: string;
  tenantId: number;
  mediaUrl?: string;
  status?: string;
  scheduledAt?: Date;
}

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    profile: string;
    tenantId: number;
  };
  files?: MediaFile[];
}

interface ServiceParams {
  campaignData: CampaignData;
  files?: MediaFile[];
  campaignId?: string | number;
  tenantId: number;
  options?: {
    delay: number;
  };
}

class CampaignController {
  private static validateUserPermission(profile: string): void {
    if (profile !== 'admin' && profile !== 'ZPRO') {
      throw new AppError('ERR_NO_PERMISSION', 403);
    }
  }

  private static async validateCampaignSchema(data: CampaignData): Promise<void> {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      start: Yup.string().required(),
      message1: Yup.string().required(),
      message2: Yup.string().required(),
      message3: Yup.string().required(),
      userId: Yup.string().required(),
      sessionId: Yup.string().required(),
      tenantId: Yup.number().required(),
      mediaUrl: Yup.string().optional(),
      status: Yup.string().optional(),
      scheduledAt: Yup.date().optional()
    });

    try {
      await schema.validate(data);
    } catch (err) {
      throw new AppError(err.message);
    }
  }

  public async store(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const { tenantId } = req.user;
    const files = req.files;

    CampaignController.validateUserPermission(req.user.profile);

    const campaignData: CampaignData = {
      ...req.body,
      userId: req.user.id,
      tenantId
    };

    await CampaignController.validateCampaignSchema(campaignData);

    const campaign = await CreateCampaignService({
      campaignData,
      files,
      tenantId
    } as ServiceParams);

    return res.status(200).json(campaign);
  }

  public async index(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const { tenantId } = req.user;
    const campaigns = await ListCampaignService({ tenantId });
    return res.status(200).json(campaigns);
  }

  public async update(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const { tenantId } = req.user;
    const files = req.files;

    CampaignController.validateUserPermission(req.user.profile);

    const campaignData: CampaignData = {
      ...req.body,
      userId: req.user.id,
      tenantId
    };

    await CampaignController.validateCampaignSchema(campaignData);

    const { campaignId } = req.params;
    const campaign = await UpdateCampaignService({
      campaignData,
      files,
      campaignId,
      tenantId
    } as ServiceParams);

    return res.status(200).json(campaign);
  }

  public async remove(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const { tenantId } = req.user;
    
    CampaignController.validateUserPermission(req.user.profile);

    const { campaignId } = req.params;
    await DeleteCampaignService({ 
      id: campaignId, 
      tenantId 
    });

    return res.status(200).json({ 
      message: 'Campaign deleted',
      success: true 
    });
  }

  public async start(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const { tenantId } = req.user;
    
    CampaignController.validateUserPermission(req.user.profile);

    const { campaignId } = req.params;
    const { delay = 2000 } = req.body;

    await StartCampaignService({ 
      campaignId, 
      tenantId,
      options: { delay }
    } as ServiceParams);

    return res.status(200).json({ 
      message: 'Campaign started',
      success: true
    });
  }

  public async cancel(req: AuthenticatedRequest, res: Response): Promise<Response> {
    const { tenantId } = req.user;
    
    CampaignController.validateUserPermission(req.user.profile);

    const { campaignId } = req.params;
    await CancelCampaignService({ 
      campaignId, 
      tenantId 
    });

    return res.status(200).json({ 
      message: 'Campaign canceled',
      success: true
    });
  }
}

export default new CampaignController(); 