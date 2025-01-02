import { Request, Response } from 'express';
import * as Yup from 'yup';
import { getIO } from '../libs/socketZPRO';
import AppError from '../errors/AppErrorZPRO';

import ListFarewellPrivateMessageService from '../services/FarewellPrivateMessage/ListFarewellPrivateMessageServiceZPRO';
import CreateFarewellPrivateMessageService from '../services/FarewellPrivateMessage/CreateFarewellPrivateMessageServiceZPRO';
import ShowFarewellPrivateMessageService from '../services/FarewellPrivateMessage/ShowFarewellPrivateMessageServiceZPRO';
import UpdateFarewellPrivateMessageService from '../services/FarewellPrivateMessage/UpdateFarewellPrivateMessageServiceZPRO';
import DeleteFarewellPrivateMessageService from '../services/FarewellPrivateMessage/DeleteFarewellPrivateMessageServiceZPRO';
import DeleteAllFarewellPrivateMessageService from '../services/FarewellPrivateMessage/DeleteAllFarewellPrivateMessageServiceZPRO';

interface IndexQuery {
  searchParam?: string;
  pageNumber?: string | number;
}

interface StoreData {
  message: string;
  userId: number;
  tenantId: number;
}

interface UpdateData {
  message?: string;
  userId: number;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;
  const { tenantId } = req.user;

  const { farewellPrivateMessage, count, hasMore } = await ListFarewellPrivateMessageService({
    searchParam,
    pageNumber,
    tenantId
  });

  return res.json({
    farewellPrivateMessage,
    count,
    hasMore
  });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  const schema = Yup.object().shape({
    message: Yup.string().required(),
    userId: Yup.number().required(),
    tenantId: Yup.number().required()
  });

  const data: StoreData = {
    ...req.body,
    userId: req.user.id,
    tenantId
  };

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const farewellPrivateMessage = await CreateFarewellPrivateMessageService(data);

  return res.status(200).json(farewellPrivateMessage);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { farewellPrivateMessageId } = req.params;
  
  const farewellPrivateMessage = await ShowFarewellPrivateMessageService(
    farewellPrivateMessageId
  );

  return res.status(200).json(farewellPrivateMessage);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  const data: UpdateData = {
    ...req.body,
    userId: req.user.id
  };

  const schema = Yup.object().shape({
    message: Yup.string(),
    userId: Yup.number().required()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const { farewellPrivateMessageId } = req.params;

  const farewellPrivateMessage = await UpdateFarewellPrivateMessageService({
    farewellPrivateMessageData: data,
    farewellPrivateMessageId
  });

  const io = getIO();
  io.emit("farewellPrivateMessage", {
    action: "update",
    farewellPrivateMessage
  });

  return res.status(200).json(farewellPrivateMessage);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { farewellPrivateMessageId } = req.params;

  await DeleteFarewellPrivateMessageService(farewellPrivateMessageId, tenantId);

  const io = getIO();
  io.emit("farewellPrivateMessage", {
    action: "delete",
    farewellPrivateMessageId
  });

  return res.status(200).json({ message: "Farewell private message deleted" });
};

export const removeAll = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  await DeleteAllFarewellPrivateMessageService(tenantId);

  const io = getIO();
  io.emit("farewellPrivateMessage", {
    action: "delete"
  });

  return res.status(200).json({ message: "All Farewell private messages deleted" });
}; 