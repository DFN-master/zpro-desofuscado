import { Request, Response } from 'express';
import * as Yup from 'yup';
import { getIO } from '../libs/socketZPRO';
import ListParticipantsListService from '../services/ParticipantsList/ListParticipantsListServiceZPRO';
import CreateParticipantsListService from '../services/ParticipantsList/CreateParticipantsListServiceZPRO';
import ShowParticipantsListService from '../services/ParticipantsList/ShowParticipantsListServiceZPRO';
import UpdateParticipantsListService from '../services/ParticipantsList/UpdateParticipantsListServiceZPRO';
import DeleteParticipantsListService from '../services/ParticipantsList/DeleteParticipantsListServiceZPRO';
import ListAllParticipantsListService from '../services/ParticipantsList/ListAllParticipantsListServiceZPRO';
import DeleteAllParticipantsListService from '../services/ParticipantsList/DeleteAllParticipantsListServiceZPRO';
import AppError from '../errors/AppErrorZPRO';

interface IndexQuery {
  searchParam?: string;
  pageNumber?: string | number;
}

interface StoreData {
  groupId: string;
  number: string;
  name: string;
}

interface UpdateData {
  groupId?: string;
  number?: string;
  name?: string;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const { participantsList, count, hasMore } = await ListParticipantsListService({
    searchParam,
    pageNumber
  });

  return res.json({
    participantsList,
    count,
    hasMore
  });
};

export const indexAll = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam } = req.query as IndexQuery;

  const { participantsList, count } = await ListAllParticipantsListService({
    searchParam
  });

  return res.json({
    participantsList,
    count
  });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const data = req.body as StoreData;

  const schema = Yup.object().shape({
    groupId: Yup.string().required(),
    number: Yup.string().required(),
    name: Yup.string().required()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError((err as Error).message);
  }

  const participantsList = await CreateParticipantsListService({
    ...data
  });

  const io = getIO();
  io.emit('participantsList', {
    action: 'create',
    participantsList
  });

  return res.status(200).json(participantsList);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { participantsListId } = req.params;

  const participantsList = await ShowParticipantsListService(participantsListId);

  return res.status(200).json(participantsList);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const data = req.body as UpdateData;
  const { participantsListId } = req.params;

  const schema = Yup.object().shape({
    groupId: Yup.string(),
    number: Yup.string(),
    name: Yup.string()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError((err as Error).message);
  }

  const participantsList = await UpdateParticipantsListService({
    participantsListData: data,
    participantsListId
  });

  const io = getIO();
  io.emit('participantsList', {
    action: 'update',
    participantsList
  });

  return res.status(200).json(participantsList);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { participantsListId } = req.params;

  await DeleteParticipantsListService(participantsListId);

  const io = getIO();
  io.emit('participantsList', {
    action: 'delete',
    participantsListId
  });

  return res.status(200).json({ message: 'Participant deleted' });
};

export const removeAll = async (req: Request, res: Response): Promise<Response> => {
  await DeleteAllParticipantsListService();

  const io = getIO();
  io.emit('participantsList', {
    action: 'delete'
  });

  return res.status(200).json({ message: 'All Participants list deleted' });
}; 