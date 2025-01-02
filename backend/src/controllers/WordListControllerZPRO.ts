import * as Yup from 'yup';
import { Request, Response } from 'express';
import { getIO } from '../libs/socketZPRO';

import ListWordListService from '../services/WordList/ListWordListServiceZPRO';
import CreateWordListService from '../services/WordList/CreateWordListServiceZPRO';
import ShowWordListService from '../services/WordList/ShowWordListServiceZPRO';
import UpdateWordListService from '../services/WordList/UpdateWordListServiceZPRO';
import DeleteWordListService from '../services/WordList/DeleteWordListServiceZPRO';
import DeleteAllWordListService from '../services/WordList/DeleteAllWordListServiceZPRO';
import AppError from '../errors/AppErrorZPRO';

interface IndexQuery {
  searchParam?: string;
  pageNumber?: string | number;
}

interface StoreData {
  word: string;
  whatsappId: number;
  groupId: {
    id: number;
  }[];
}

interface WordListData {
  word?: string;
  whatsappId?: number;
  groupId?: number;
  userId: number;
  tenantId: number | string;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;
  const { tenantId } = req.user;

  const { wordList, count, hasMore } = await ListWordListService({
    searchParam,
    pageNumber,
    tenantId
  });

  return res.json({
    wordList,
    count,
    hasMore
  });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, id } = req.user;
  const { word, whatsappId, groupId } = req.body as StoreData;

  const schema = Yup.object().shape({
    groupId: Yup.string().required(),
    word: Yup.string().required(),
    userId: Yup.number().required(),
    tenantId: Yup.number().required()
  });

  const createdWordLists = [];

  for (const group of groupId) {
    const data = {
      word,
      whatsappId,
      groupId: group.id,
      userId: parseInt(id),
      tenantId
    };

    try {
      await schema.validate(data);
      const wordList = await CreateWordListService(data);
      createdWordLists.push(wordList);
    } catch (err) {
      throw new AppError(err.message);
    }
  }

  return res.status(200).json(createdWordLists);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { wordListId } = req.params;
  const wordList = await ShowWordListService(wordListId);
  return res.status(200).json(wordList);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const data = {
    ...req.body,
    userId: req.user.id,
    tenantId
  };

  const schema = Yup.object().shape({
    groupId: Yup.string(),
    word: Yup.string(),
    userId: Yup.number().required()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const { wordListId } = req.params;
  const wordList = await UpdateWordListService({
    wordListData: data,
    wordListId
  });

  const io = getIO();
  io.emit("wordList", {
    action: "update",
    wordList
  });

  return res.status(200).json(wordList);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { wordListId } = req.params;

  await DeleteWordListService(wordListId, tenantId);

  const io = getIO();
  io.emit("wordList", {
    action: "delete",
    wordListId
  });

  return res.status(200).json({ message: "WordList deleted" });
};

export const removeAll = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  await DeleteAllWordListService(tenantId);

  const io = getIO();
  io.emit("wordList", {
    action: "delete"
  });

  return res.status(200).json({ message: "All WordList deleted" });
}; 