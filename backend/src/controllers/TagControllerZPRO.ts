import * as Yup from 'yup';
import { Request, Response } from 'express';
import AppError from '../errors/AppErrorZPRO';
import CreateTagService from '../services/TagServices/CreateTagServiceZPRO';
import ListTagService from '../services/TagServices/ListTagServiceZPRO';
import DeleteTagService from '../services/TagServices/DeleteTagServiceZPRO';
import UpdateTagService from '../services/TagServices/UpdateTagServiceZPRO';

interface TagData {
  tag: string;
  color: string;
  userId: number;
  tenantId: number;
  isActive?: boolean;
}

interface RequestWithUser extends Request {
  user: {
    id: number;
    profile: string;
    tenantId: number;
  };
}

export const store = async (req: RequestWithUser, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  if (req.user.profile !== 'admin' && req.user.profile !== 'super') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const data: TagData = {
    ...req.body,
    userId: req.user.id,
    tenantId
  };

  const schema = Yup.object().shape({
    tag: Yup.string().required(),
    color: Yup.string().required(),
    userId: Yup.number().required(),
    tenantId: Yup.number().required()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const tag = await CreateTagService(data);

  return res.status(200).json(tag);
};

export const index = async (req: RequestWithUser, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { isActive } = req.query;

  const tags = await ListTagService({
    tenantId,
    isActive: isActive ? isActive === 'true' : false
  });

  return res.status(200).json(tags);
};

export const update = async (req: RequestWithUser, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  if (req.user.profile !== 'admin' && req.user.profile !== 'super') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const data = {
    ...req.body,
    userId: req.user.id,
    tenantId
  };

  const schema = Yup.object().shape({
    tag: Yup.string().required(),
    color: Yup.string().required(),
    isActive: Yup.boolean().required(),
    userId: Yup.number().required()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const { tagId } = req.params;

  const tag = await UpdateTagService({
    tagData: data,
    tagId
  });

  return res.status(200).json(tag);
};

export const remove = async (req: RequestWithUser, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  if (req.user.profile !== 'admin' && req.user.profile !== 'super') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const { tagId } = req.params;

  await DeleteTagService({
    id: tagId,
    tenantId
  });

  return res.status(200).json({ message: 'Tag deleted' });
}; 