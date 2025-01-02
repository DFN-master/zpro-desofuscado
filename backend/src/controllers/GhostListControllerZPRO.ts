import { Request, Response } from 'express';
import * as Yup from 'yup';
import { getIO } from '../libs/socketZPRO';

import ListGhostListService from '../services/GhostListService/ListGhostListServiceZPRO';
import CreateGhostListService from '../services/GhostListService/CreateGhostListServiceZPRO';
import ShowGhostListService from '../services/GhostListService/ShowGhostListServiceZPRO';
import UpdateGhostListService from '../services/GhostListService/UpdateGhostListServiceZPRO';
import DeleteGhostListService from '../services/GhostListService/DeleteGhostListServiceZPRO';
import DeleteAllGhostListService from '../services/GhostListService/DeleteAllGhostListServiceZPRO';
import AppError from '../errors/AppErrorZPRO';

interface IndexQuery {
  searchParam?: string;
  pageNumber?: string | number;
}

interface GhostListData {
  shortcut: string;
  message: string;
}

interface UpdateGhostListData {
  ghostListData: GhostListData;
  ghostListId: number | string;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;

  const { ghostList, count, hasMore } = await ListGhostListService({
    searchParam,
    pageNumber
  });

  return res.json({
    ghostList,
    count,
    hasMore
  });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const data = req.body as GhostListData;

  const schema = Yup.object().shape({
    shortcut: Yup.string().required(),
    message: Yup.string().required()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const ghostList = await CreateGhostListService({
    ...data
  });

  const io = getIO();
  io.emit("ghostList", {
    action: "create",
    ghostList
  });

  return res.status(200).json(ghostList);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { ghostListId } = req.params;

  const ghostList = await ShowGhostListService(ghostListId);

  return res.status(200).json(ghostList);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const data = req.body as GhostListData;
  const schema = Yup.object().shape({
    shortcut: Yup.string(),
    message: Yup.string()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const { ghostListId } = req.params;

  const ghostList = await UpdateGhostListService({
    ghostListData: data,
    ghostListId
  });

  const io = getIO();
  io.emit("ghostList", {
    action: "update",
    ghostList
  });

  return res.status(200).json(ghostList);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { ghostListId } = req.params;

  await DeleteGhostListService(ghostListId);

  const io = getIO();
  io.emit("ghostList", {
    action: "delete",
    ghostListId
  });

  return res.status(200).json({ message: "Ghost list deleted" });
};

export const removeAll = async (req: Request, res: Response): Promise<Response> => {
  await DeleteAllGhostListService();

  const io = getIO();
  io.emit("ghostList", {
    action: "delete"
  });

  return res.status(200).json({ message: "All Ghost list deleted" });
}; 