import { Request, Response } from 'express';
import ListGroupMessageService from '../services/GroupServices/ListGroupMessageServiceZPRO';
import DeleteGroupMessageService from '../services/GroupServices/DeleteGroupMessageServiceZPRO';
import ListUserGroupMessageService from '../services/GroupServices/ListUserGroupMessageServiceZPRO';
import FindUserByGroupMessageService from '../services/UserGroupService/FindUserByGroupMessageServiceZPRO';
import UsersPrivateGroups from '../models/UsersPrivateGroupsZPRO';
import CreateGroupMessageService from '../services/GroupServices/CreateGroupMessageServiceZPRO';
import UpdateGroupMessageService from '../services/GroupServices/UpdateGroupMessageServiceZPRO';
import AppError from '../errors/AppErrorZPRO';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    profile: string;
    tenantId: number;
  };
}

export const update = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  if (req.user.profile !== 'admin' && req.user.profile !== 'super') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const groupData = {
    ...req.body,
    userId: req.user.id,
    tenantId
  };

  const { groupId } = req.params;
  
  const group = await UpdateGroupMessageService({
    groupData,
    groupId
  });

  return res.status(200).json(group);
};

export const remove = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  if (req.user.profile !== 'admin' && req.user.profile !== 'super') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const { groupId } = req.params;

  await DeleteGroupMessageService({
    tenantId,
    id: groupId
  });

  return res.status(200).json({ message: 'GROUP_REMOVE' });
};

export const index = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  const groups = await ListGroupMessageService({
    tenantId
  });

  return res.status(200).json(groups);
};

export const store = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  if (req.user.profile !== 'admin' && req.user.profile !== 'super') {
    throw new AppError('ERR_NO_PERMISSION', 403);
  }

  const groupData = {
    ...req.body,
    userId: req.user.id,
    tenantId
  };

  const group = await CreateGroupMessageService(groupData);

  return res.status(200).json(group);
};

export const listUserGroups = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { tenantId, id } = req.user;

  const groups = await ListUserGroupMessageService({
    tenantId,
    userId: id
  });

  return res.status(200).json(groups);
};

export const listUserbyGroup = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { groupId } = req.params;

  const users = await FindUserByGroupMessageService(Number(groupId));

  return res.status(200).json(users);
};

export const storeUser = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { groupId, userId } = req.body;

  let userGroup = await UsersPrivateGroups.findOne({
    where: {
      userId,
      groupId
    }
  });

  if (userGroup) {
    throw new AppError('GROUP_EXISTS', 404);
  }

  userGroup = await UsersPrivateGroups.create({
    userId,
    groupId
  });

  return res.status(200).json(userGroup);
};

export const removeUser = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { groupId, userId } = req.params;

  const userGroup = await UsersPrivateGroups.findOne({
    where: {
      userId,
      groupId
    }
  });

  if (!userGroup) {
    throw new AppError('NOT_EXISTS', 404);
  }

  await userGroup.destroy();

  return res.status(200).json(userGroup);
}; 