import { Request, Response } from 'express';
import DashTicketsAndTimesZPRO from '../../services/Statistics/DashTicketsAndTimesZPRO';
import DashTicketsChannelsZPRO from '../../services/Statistics/DashTicketsChannelsZPRO';
import DashTicketsEvolutionChannelsZPRO from '../../services/Statistics/DashTicketsEvolutionChannelsZPRO';
import DashTicketsEvolutionByPeriodZPRO from '../../services/Statistics/DashTicketsEvolutionByPeriodZPRO';
import DashTicketsPerUsersDetailZPRO from '../../services/Statistics/DashTicketsPerUsersDetailZPRO';
import DashTicketsQueueZPRO from '../../services/Statistics/DashTicketsQueueZPRO';
import DashTicketsUserZPRO from '../../services/Statistics/DashTicketsUserZPRO';
import DashTicketsStatusZPRO from '../../services/Statistics/DashTicketsStatusZPRO';

interface DashboardRequest extends Request {
  user?: {
    tenantId: number;
    id: number;
    profile: string;
  };
  query: {
    startDate: string;
    endDate: string;
    isGroup: boolean;
  };
}

export const getDashTicketsAndTimes = async (req: DashboardRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { startDate, endDate, isGroup } = req.query;
  const userId = req.user.id;
  const userProfile = req.user.profile;

  const result = await DashTicketsAndTimesZPRO.default({
    startDate,
    endDate,
    tenantId,
    userId,
    userProfile,
    isGroup
  });

  return res.json(result);
};

export const getDashTicketsChannels = async (req: DashboardRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { startDate, endDate, isGroup } = req.query;
  const userId = req.user.id;
  const userProfile = req.user.profile;

  const result = await DashTicketsChannelsZPRO.default({
    startDate,
    endDate,
    tenantId,
    userId,
    userProfile,
    isGroup
  });

  return res.json(result);
};

export const getDashTicketsEvolutionChannels = async (req: DashboardRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { startDate, endDate, isGroup } = req.query;
  const userId = req.user.id;
  const userProfile = req.user.profile;

  const result = await DashTicketsEvolutionChannelsZPRO.default({
    startDate,
    endDate,
    tenantId,
    userId,
    userProfile,
    isGroup
  });

  return res.json(result);
};

export const getDashTicketsEvolutionByPeriod = async (req: DashboardRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { startDate, endDate, isGroup } = req.query;
  const userId = req.user.id;
  const userProfile = req.user.profile;

  const result = await DashTicketsEvolutionByPeriodZPRO.default({
    startDate,
    endDate,
    tenantId,
    userId,
    userProfile,
    isGroup
  });

  return res.json(result);
};

export const getDashTicketsPerUsersDetail = async (req: DashboardRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { startDate, endDate, isGroup } = req.query;
  const userId = req.user.id;
  const userProfile = req.user.profile;

  const result = await DashTicketsPerUsersDetailZPRO.default({
    startDate,
    endDate,
    tenantId,
    userId,
    userProfile,
    isGroup
  });

  return res.json(result);
};

export const getDashTicketsQueue = async (req: DashboardRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { startDate, endDate, isGroup } = req.query;
  const userId = req.user.id;
  const userProfile = req.user.profile;

  const result = await DashTicketsQueueZPRO.default({
    startDate,
    endDate,
    tenantId,
    userId,
    userProfile,
    isGroup
  });

  return res.json(result);
};

export const getDashTicketsUser = async (req: DashboardRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { startDate, endDate, isGroup } = req.query;
  const userId = req.user.id;
  const userProfile = req.user.profile;

  const result = await DashTicketsUserZPRO.default({
    startDate,
    endDate,
    tenantId,
    userId,
    userProfile,
    isGroup
  });

  return res.json(result);
};

export const getDashTicketsStatus = async (req: DashboardRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { startDate, endDate, isGroup } = req.query;
  const userId = req.user.id;
  const userProfile = req.user.profile;

  const result = await DashTicketsStatusZPRO.default({
    startDate,
    endDate,
    tenantId,
    userId,
    userProfile,
    isGroup
  });

  return res.json(result);
}; 