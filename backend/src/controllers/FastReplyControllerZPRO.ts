import { Request, Response } from 'express';
import * as Yup from 'yup';
import AppError from '../errors/AppErrorZPRO';
import CreateFastReplyService from '../services/FastReplyServices/CreateFastReplyServiceZPRO';
import ListFastReplyService from '../services/FastReplyServices/ListFastReplyServiceZPRO';
import DeleteFastReplyService from '../services/FastReplyServices/DeleteFastReplyServiceZPRO';
import UpdateFastReplyService from '../services/FastReplyServices/UpdateFastReplyServiceZPRO';

interface FastReplyData {
  key: string;
  message: string;
  userId: number;
  tenantId: number;
  mediaPath?: string | null;
}

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    profile: string;
    tenantId: number;
  };
}

export const store = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  if (req.user.profile !== "admin" && req.user.profile !== "super") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const data: FastReplyData = {
    ...req.body,
    userId: req.user.id,
    tenantId
  };

  if (req.file) {
    data.mediaPath = req.file.filename;
  }

  const schema = Yup.object().shape({
    key: Yup.string().required(),
    message: Yup.string().required(),
    userId: Yup.number().required(),
    tenantId: Yup.number().required()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const fastReply = await CreateFastReplyService(data);

  return res.status(200).json(fastReply);
};

export const index = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const fastReplies = await ListFastReplyService({ tenantId });
  return res.status(200).json(fastReplies);
};

export const update = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  if (req.user.profile !== "admin" && req.user.profile !== "super") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const data: FastReplyData = {
    ...req.body,
    userId: req.user.id,
    tenantId
  };

  if (req.file && !req.body.medias) {
    data.mediaPath = req.file.filename;
  }

  if (!req.file && !req.body.medias) {
    data.mediaPath = null;
  }

  if (req.body.medias === "null") {
    data.mediaPath = null;
  }

  const schema = Yup.object().shape({
    key: Yup.string().required(),
    message: Yup.string().required(),
    userId: Yup.number().required()
  });

  try {
    await schema.validate(data);
  } catch (err) {
    throw new AppError(err.message);
  }

  const { fastReplyId } = req.params;

  const fastReply = await UpdateFastReplyService({
    fastReplyData: data,
    fastReplyId: +fastReplyId
  });

  return res.status(200).json(fastReply);
};

export const remove = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const { tenantId } = req.user;

  if (req.user.profile !== "admin" && req.user.profile !== "super") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const { fastReplyId } = req.params;

  await DeleteFastReplyService({
    id: +fastReplyId,
    tenantId
  });

  return res.status(200).json({ message: "Fast Reply deleted" });
}; 