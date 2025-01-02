import { Request, Response } from 'express';
import * as Yup from 'yup';
import { getIO } from '../libs/socket';
import ListBanListService from '../services/BanList/ListBanListServiceZPRO';
import CreateBanListService from '../services/BanList/CreateBanListServiceZPRO';
import ShowBanListService from '../services/BanList/ShowBanListServiceZPRO';
import UpdateBanListService from '../services/BanList/UpdateBanListServiceZPRO';
import DeleteBanListService from '../services/BanList/DeleteBanListServiceZPRO';
import DeleteAllBanListService from '../services/BanList/DeleteAllBanListServiceZPRO';
import AppError from '../errors/AppErrorZPRO';

interface IndexQuery {
  searchParam?: string;
  pageNumber?: string | number;
  tenantId: number;
}

interface StoreData {
  number: string;
  whatsappId: number;
  groupId: any[];
  userId: number;
  tenantId: number;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query;
  const { tenantId } = req.user;

  const { banList, count, hasMore } = await ListBanListService({
    searchParam: searchParam as string,
    pageNumber: pageNumber as string,
    tenantId
  } as IndexQuery);

  return res.json({
    banList,
    count,
    hasMore
  });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, id } = req.user;
  const { number, whatsappId, groupId } = req.body;

  const schema = Yup.object().shape({
    groupId: Yup.string().required(),
    number: Yup.string().required(),
    userId: Yup.number().required(),
    tenantId: Yup.number().required()
  });

  const banListArray = [];

  for (const group of groupId) {
    const data: StoreData = {
      number,
      whatsappId,
      groupId: group.id,
      userId: parseInt(id),
      tenantId
    };

    try {
      await schema.validate(data);
      const banList = await CreateBanListService(data);
      banListArray.push(banList);
    } catch (error) {
      throw new AppError(error.message);
    }
  }

  return res.status(200).json(banListArray);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { banListId } = req.params;
  const banList = await ShowBanListService(banListId);
  return res.status(200).json(banList);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  
  const banListData = {
    ...req.body,
    userId: req.user.id,
    tenantId
  };

  const schema = Yup.object().shape({
    groupId: Yup.string(),
    number: Yup.string(),
    userId: Yup.number().required()
  });

  try {
    await schema.validate(banListData);
  } catch (error) {
    throw new AppError(error.message);
  }

  const { banListId } = req.params;
  const banList = await UpdateBanListService({
    banListData,
    banListId
  });

  const io = getIO();
  io.emit("banList", {
    action: "update",
    banList
  });

  return res.status(200).json(banList);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { banListId } = req.params;

  await DeleteBanListService(banListId, tenantId);

  const io = getIO();
  io.emit("banList", {
    action: "delete",
    banListId
  });

  return res.status(200).json({ message: "Banlist deleted" });
};

export const removeAll = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  await DeleteAllBanListService(tenantId);

  const io = getIO();
  io.emit("banList", { action: "delete" });

  return res.status(200).json({ message: "All Banlist deleted" });
}; 