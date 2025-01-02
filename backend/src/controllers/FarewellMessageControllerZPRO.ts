import { Request, Response } from 'express';
import * as Yup from 'yup';
import { getIO } from '../libs/socketZPRO';
import ListFarewellMessageService from '../services/FarewellMessage/ListFarewellMessageServiceZPRO';
import CreateFarewellMessageService from '../services/FarewellMessage/CreateFarewellMessageServiceZPRO';
import ShowFarewellMessageService from '../services/FarewellMessage/ShowFarewellMessageServiceZPRO';
import UpdateFarewellMessageService from '../services/FarewellMessage/UpdateFarewellMessageServiceZPRO';
import DeleteFarewellMessageService from '../services/FarewellMessage/DeleteFarewellMessageServiceZPRO';
import DeleteAllFarewellMessageService from '../services/FarewellMessage/DeleteAllFarewellMessageServiceZPRO';
import AppError from '../errors/AppErrorZPRO';

interface FarewellMessageData {
  message: string;
  whatsappId: number;
  groupId: number;
  userId: number;
  tenantId: number;
}

interface IndexQuery {
  searchParam?: string;
  pageNumber?: string | number;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber } = req.query as IndexQuery;
  const { tenantId } = req.user;

  const { farewellMessage, count, hasMore } = await ListFarewellMessageService({
    searchParam,
    pageNumber,
    tenantId
  });

  return res.json({
    farewellMessage,
    count,
    hasMore
  });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId, id: userId } = req.user;
  const { message, whatsappId, groupId } = req.body;

  const schema = Yup.object().shape({
    groupId: Yup.string().required(),
    message: Yup.string().required(),
    userId: Yup.number().required(),
    tenantId: Yup.number().required()
  });

  const farewellMessages = [];

  for (const group of groupId) {
    const data: FarewellMessageData = {
      message,
      whatsappId,
      groupId: group.id,
      userId: parseInt(userId),
      tenantId
    };

    try {
      await schema.validate(data);
      const farewellMessage = await CreateFarewellMessageService(data);
      farewellMessages.push(farewellMessage);
    } catch (err) {
      throw new AppError(err.message);
    }
  }

  return res.status(200).json(farewellMessages);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { farewellMessageId } = req.params;
  const farewellMessage = await ShowFarewellMessageService(farewellMessageId);
  return res.status(200).json(farewellMessage);
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
    message: Yup.string(),
    userId: Yup.number().required()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const { farewellMessageId } = req.params;

  const farewellMessage = await UpdateFarewellMessageService({
    farewellMessageData: data,
    farewellMessageId
  });

  const io = getIO();
  io.emit("farewellMessage", {
    action: "update",
    farewellMessage
  });

  return res.status(200).json(farewellMessage);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { farewellMessageId } = req.params;

  await DeleteFarewellMessageService(farewellMessageId, tenantId);

  const io = getIO();
  io.emit("farewellMessage", {
    action: "delete",
    farewellMessageId
  });

  return res.status(200).json({ message: "Farewell Message deleted" });
};

export const removeAll = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  await DeleteAllFarewellMessageService(tenantId);

  const io = getIO();
  io.emit("farewellMessage", {
    action: "delete"
  });

  return res.status(200).json({ message: "All Farewell Messages deleted" });
}; 