import { Request, Response } from 'express';
import StatisticsPerUsersZPRO from '../../services/Statistics/StatisticsPerUsersZPRO';

interface QueryParams {
  startDate: string;
  endDate: string;
}

interface CustomRequest extends Request {
  user: {
    tenantId: string;
  };
  query: QueryParams;
}

export const index = async (req: CustomRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { startDate, endDate } = req.query;

  const params = {
    startDate,
    endDate,
    tenantId
  };

  const statistics = await StatisticsPerUsersZPRO(params);
  return res.json(statistics);
}; 