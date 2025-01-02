import { Request, Response } from 'express';
import * as Yup from 'yup';
import { getIO } from '../libs/socket';
import GroupChat from '../models/GroupChat';
import ListGroupLinkListService from '../services/GroupLinkList/ListGroupLinkListServiceZPRO';
import CreateGroupLinkListService from '../services/GroupLinkList/CreateGroupLinkListServiceZPRO';
import ShowGroupLinkListService from '../services/GroupLinkList/ShowGroupLinkListServiceZPRO';
import UpdateGroupLinkListService from '../services/GroupLinkList/UpdateGroupLinkListServiceZPRO';
import DeleteGroupLinkListService from '../services/GroupLinkList/DeleteGroupLinkListServiceZPRO';
import DeleteAllGroupLinkListService from '../services/GroupLinkList/DeleteAllGroupLinkListServiceZPRO';
import ListAllGroupLinkListService from '../services/GroupLinkList/ListAllGroupLinkListServiceZPRO';
import GetTicketWbotById from '../helpers/GetTicketWbotByIdZPRO';
import AppError from '../errors/AppErrorZPRO';

interface IndexQuery {
  searchParam?: string;
  pageNumber?: string | number;
}

interface StoreData {
  groupId: string;
  name?: string;
  link?: string;
  participants?: number;
}

interface UpdateData {
  groupLinkListData: StoreData;
  groupLinkListId: string | number;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const { groupLinkList, count, hasMore } = await ListGroupLinkListService({
    searchParam,
    pageNumber
  });

  return res.json({
    groupLinkList,
    count,
    hasMore
  });
};

export const indexAll = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam } = req.query as IndexQuery;

  const { groupLinkList, count } = await ListAllGroupLinkListService({
    searchParam
  });

  return res.json({
    groupLinkList,
    count
  });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const data = req.body as StoreData;
  
  const schema = Yup.object().shape({
    groupId: Yup.string().required()
  });

  const wbot = await GetTicketWbotById(req.body.whatsappId);
  const chatGroup = await wbot.getChatById(req.body.groupId);

  let participants = 0;
  let name = '';
  let link = '';

  if (chatGroup instanceof GroupChat) {
    participants = chatGroup.participants.length;
    name = chatGroup.name;
    link = await chatGroup.getInviteCode();
  } else {
    throw new AppError('Group data not available');
  }

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const groupLinkList = await CreateGroupLinkListService({
    groupId: req.body.groupId,
    name,
    link: `https://chat.whatsapp.com/${link}`,
    participants: participants.toString()
  });

  const io = getIO();
  io.emit('groupLinkList', {
    action: 'create',
    groupLinkList
  });

  return res.status(200).json(groupLinkList);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { groupLinkListId } = req.params;
  const groupLinkList = await ShowGroupLinkListService(groupLinkListId);
  return res.status(200).json(groupLinkList);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const wbot = await GetTicketWbotById(req.body.whatsappId);
  const chatGroup = await wbot.getChatById(req.body.groupId);

  let participants = 0;
  let name = '';
  let link = '';

  if (chatGroup instanceof GroupChat) {
    participants = chatGroup.participants.length;
    name = chatGroup.name;
    link = await chatGroup.getInviteCode();
  } else {
    throw new AppError('Group data not available');
  }

  const { groupLinkListId } = req.params;

  const groupLinkList = await UpdateGroupLinkListService({
    groupLinkListData: {
      groupId: req.body.groupId,
      name,
      link: `https://chat.whatsapp.com/${link}`,
      participants: participants.toString()
    },
    groupLinkListId
  });

  const io = getIO();
  io.emit('groupLinkList', {
    action: 'update',
    groupLinkList
  });

  return res.status(200).json(groupLinkList);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { groupLinkListId } = req.params;
  await DeleteGroupLinkListService(groupLinkListId);

  const io = getIO();
  io.emit('groupLinkList', {
    action: 'delete',
    groupLinkListId
  });

  return res.status(200).json({ message: 'Group link list deleted' });
};

export const removeAll = async (req: Request, res: Response): Promise<Response> => {
  await DeleteAllGroupLinkListService();

  const io = getIO();
  io.emit('groupListLink', {
    action: 'delete'
  });

  return res.status(200).json({ message: 'All Group List Link deleted' });
}; 