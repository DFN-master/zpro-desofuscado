import { Request, Response } from 'express';
import ChangeGroupDescriptionService from '../services/GroupBulkServices/ChangeGroupDescriptionZPRO';
import ChangeGroupTitleService from '../services/GroupBulkServices/ChangeGroupTitleZPRO';
import ChangeGroupPictureService from '../services/GroupBulkServices/ChangeGroupPictureZPRO';
import SetAdminsMessagesOnlyGroupService from '../services/GroupBulkServices/SetAdminsMessagesOnlyGroupZPRO';
import PromoteGroupParticipantService from '../services/GroupBulkServices/PromoteGroupParticipantZPRO';
import DemoteGroupParticipantService from '../services/GroupBulkServices/DemoteGroupParticipantZPRO';
import AddGroupParticipantService from '../services/GroupBulkServices/AddGroupParticipantZPRO';
import RemoveGroupParticipantService from '../services/GroupBulkServices/RemoveGroupParticipantZPRO';
import SendGroupMessageService from '../services/GroupBulkServices/SendGroupMessageZPRO';
import SendGroupMediaService from '../services/GroupBulkServices/SendGroupMediaZPRO';
import SendGroupVoiceService from '../services/GroupBulkServices/SendGroupVoiceZPRO';

interface GroupRequest {
  description?: string;
  title?: string;
  picture?: string;
  whatsappId: string;
  adminsOnly?: boolean;
  participants?: string[];
  message?: string;
  media?: string;
  caption?: string;
}

export const changeDescription = async (req: Request, res: Response): Promise<Response> => {
  const { description, whatsappId } = req.body as GroupRequest;
  
  try {
    await ChangeGroupDescriptionService({ description, whatsappId });
    return res.send();
  } catch (err) {
    return res.status(400).json({ error: "CHANGE_DESCRIPTION_GROUP_ERROR" });
  }
};

export const changeTitle = async (req: Request, res: Response): Promise<Response> => {
  const { title, whatsappId } = req.body as GroupRequest;

  try {
    await ChangeGroupTitleService({ title, whatsappId });
    return res.send();
  } catch (err) {
    return res.status(400).json({ error: "CHANGE_TITLE_GROUP_ERROR" });
  }
};

export const changePicture = async (req: Request, res: Response): Promise<Response> => {
  const { picture, whatsappId } = req.body as GroupRequest;

  try {
    await ChangeGroupPictureService({ picture, whatsappId });
    return res.send();
  } catch (err) {
    return res.status(400).json({ error: "CHANGE_PICTURE_GROUP_ERROR" });
  }
};

export const setAdminsOnly = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId, adminsOnly } = req.body as GroupRequest;

  try {
    await SetAdminsMessagesOnlyGroupService({ whatsappId, adminsOnly });
    return res.send();
  } catch (err) {
    return res.status(400).json({ error: "SET_ADMINS_ONLY_GROUP_ERROR" });
  }
};

export const promoteParticipant = async (req: Request, res: Response): Promise<Response> => {
  const { participants, whatsappId } = req.body as GroupRequest;

  try {
    await PromoteGroupParticipantService({ participants, whatsappId });
    return res.send();
  } catch (err) {
    return res.status(400).json({ error: "PROMOTE_PARTICIPANT_GROUP_ERROR" });
  }
};

export const demoteParticipant = async (req: Request, res: Response): Promise<Response> => {
  const { participants, whatsappId } = req.body as GroupRequest;

  try {
    await DemoteGroupParticipantService({ participants, whatsappId });
    return res.send();
  } catch (err) {
    return res.status(400).json({ error: "DEMOTE_PARTICIPANT_GROUP_ERROR" });
  }
};

export const addParticipant = async (req: Request, res: Response): Promise<Response> => {
  const { participants, whatsappId } = req.body as GroupRequest;

  try {
    await AddGroupParticipantService({ participants, whatsappId });
    return res.send();
  } catch (err) {
    return res.status(400).json({ error: "ADD_PARTICIPANT_GROUP_ERROR" });
  }
};

export const removeParticipant = async (req: Request, res: Response): Promise<Response> => {
  const { participants, whatsappId } = req.body as GroupRequest;

  try {
    await RemoveGroupParticipantService({ participants, whatsappId });
    return res.send();
  } catch (err) {
    return res.status(400).json({ error: "REMOVE_PARTICIPANT_GROUP_ERROR" });
  }
};

export const sendMessage = async (req: Request, res: Response): Promise<Response> => {
  const { message, whatsappId } = req.body as GroupRequest;

  try {
    await SendGroupMessageService({ message, whatsappId });
    return res.send();
  } catch (err) {
    return res.status(400).json({ error: "SEND_MESSAGE_GROUP_ERROR" });
  }
};

export const sendMedia = async (req: Request, res: Response): Promise<Response> => {
  const { media, whatsappId, caption } = req.body as GroupRequest;

  try {
    await SendGroupMediaService({ media, whatsappId, caption });
    return res.send();
  } catch (err) {
    return res.status(400).json({ error: "SEND_MEDIA_GROUP_ERROR" });
  }
};

export const sendVoice = async (req: Request, res: Response): Promise<Response> => {
  const { media, whatsappId } = req.body as GroupRequest;

  try {
    await SendGroupVoiceService({ media, whatsappId });
    return res.send();
  } catch (err) {
    return res.status(400).json({ error: "SEND_VOICE_GROUP_ERROR" });
  }
}; 