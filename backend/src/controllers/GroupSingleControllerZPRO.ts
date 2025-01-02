import { Request, Response } from 'express';
import * as Yup from 'yup';
import AppError from '../errors/AppError';
import ListGroupsService from '../services/GroupServices/ListGroupsService';
import ListGroupByIdService from '../services/GroupServices/ListGroupByIdService';
import ListParticipantsService from '../services/GroupServices/ListParticipantsService';
import CreateGroupService from '../services/GroupServices/CreateGroupService';
import ChangeGroupDescriptionService from '../services/GroupServices/ChangeGroupDescriptionService';
import ChangeGroupTitleService from '../services/GroupServices/ChangeGroupTitleService';
import ChangeGroupPictureService from '../services/GroupServices/ChangeGroupPictureService';
import SetAdminsMessagesOnlyGroupService from '../services/GroupServices/SetAdminsMessagesOnlyGroupService';
import PromoteGroupParticipantService from '../services/GroupServices/PromoteGroupParticipantService';
import DemoteGroupParticipantService from '../services/GroupServices/DemoteGroupParticipantService';
import AddGroupParticipantService from '../services/GroupServices/AddGroupParticipantService';
import RemoveGroupParticipantService from '../services/GroupServices/RemoveGroupParticipantService';
import ChangeGroupPictureFileService from '../services/GroupServices/ChangeGroupPictureFileService';
import ListWhatsAppsService from '../services/WhatsappService/ListWhatsAppsService';
import Whatsapp from '../models/Whatsapp';

interface GroupData {
  name: string;
  id: string;
}

interface ParticipantData {
  groupId: string;
  participants: string[];
}

const randomDelay = Math.floor(Math.random() * (2000 - 1000 + 1) + 1000);

export const listGroup = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { whatsappId } = req.params;

  const whatsapps = await ListWhatsAppsService(tenantId);
  const whatsapp = whatsapps.find(w => w.id === parseInt(whatsappId));

  if (!whatsapp) {
    throw new AppError("ERR_SESSION_NOT_ALLOWED", 404);
  }

  try {
    const groups = await ListGroupsService({
      whatsappId,
      channel: whatsapp?.channel
    });

    if (whatsapp?.channel === "whatsapp") {
      const formattedGroups = groups.map(group => ({
        name: group.subject,
        id: group.id
      }));
      return res.json({ groups: formattedGroups });
    }

    if (whatsapp?.channel === "baileys") {
      const formattedGroups = groups
        .filter(group => group.id.includes("g.us"))
        .map(group => ({
          name: group.name,
          id: group.id.split("@")[0]
        }));
      return res.json({ groups: formattedGroups });
    }

    return res.json({ groups });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Permissão de listagem não permitida" });
  }
};

export const listGroupIds = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { whatsappId } = req.params;

  const whatsapps = await ListWhatsAppsService(tenantId);
  const whatsapp = whatsapps.find(w => w.id === parseInt(whatsappId));

  if (!whatsapp) {
    throw new AppError("ERR_SESSION_NOT_ALLOWED", 404);
  }

  try {
    const groups = await ListGroupsService({
      whatsappId,
      channel: whatsapp?.channel
    });

    if (whatsapp?.channel === "whatsapp") {
      const formattedGroups = groups.map(group => ({
        name: group.subject,
        id: group.id
      }));
      return res.json({ groups: formattedGroups });
    }

    if (whatsapp?.channel === "baileys") {
      const formattedGroups = groups
        .filter(group => group.id.includes("g.us"))
        .map(group => ({
          name: group.name,
          id: group.id.split("@")[0]
        }));
      return res.json({ groups: formattedGroups });
    }

    return res.json({ groups });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Erro ao listar grupos" });
  }
};

export const listGroupById = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId, groupId } = req.params;

  try {
    const group = await ListGroupByIdService({
      whatsappId,
      groupId
    });

    return res.json({ group });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Erro ao buscar grupo" });
  }
};

export const listParticipants = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { whatsappId, groupIds } = req.params;

  const whatsapps = await ListWhatsAppsService(tenantId);
  const whatsapp = whatsapps.find(w => w.id === parseInt(whatsappId));

  if (!whatsapp) {
    throw new AppError("ERR_SESSION_NOT_ALLOWED", 404);
  }

  const whatsappChannels = whatsapps.map(w => w.channel);

  try {
    const participantsList: ParticipantData[] = [];

    for (const groupId of groupIds) {
      try {
        const participants = await ListParticipantsService({
          whatsappId,
          groupId
        });

        if (whatsappChannels?.channel === "whatsapp") {
          const formattedParticipants = participants
            .filter(p => p.id.includes("c.us"))
            .map(p => p.id);

          participantsList.push({
            groupId,
            participants: formattedParticipants
          });

          await new Promise(resolve => setTimeout(resolve, randomDelay));
        } else {
          const formattedParticipants = participants
            .filter(p => p.id.user.includes("s.whatsapp") || p.id.user.includes("c.us"))
            .map(p => p.id.user);

          participantsList.push({
            groupId,
            participants: formattedParticipants
          });

          await new Promise(resolve => setTimeout(resolve, randomDelay));
        }
      } catch (err) {
        participantsList.push({
          groupId,
          status: "error",
          error: err.message
        });
      }
    }

    return res.json(participantsList);

  } catch (err) {
    return res.status(500).json({ error: "Erro ao listar participantes do grupo" });
  }
};

export const createGroups = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { titles, whatsappId, number } = req.body;

  const whatsapps = await ListWhatsAppsService(tenantId);
  const whatsapp = whatsapps.find(w => w.id === parseInt(whatsappId));

  if (!whatsapp) {
    throw new AppError("ERR_SESSION_NOT_ALLOWED", 404);
  }

  const results = [];

  try {
    for (const title of titles) {
      try {
        await CreateGroupService({
          title,
          whatsappId,
          number
        });

        results.push({
          title,
          status: "success"
        });

        await new Promise(resolve => setTimeout(resolve, randomDelay));
      } catch (err) {
        results.push({
          title,
          status: "error",
          error: err.message
        });
      }
    }

    return res.json(results);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao criar grupos" });
  }
};

export const changeDescriptions = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { description, whatsappId, groupIds } = req.body;

  const whatsapps = await ListWhatsAppsService(tenantId);
  const whatsapp = whatsapps.find(w => w.id === parseInt(whatsappId));

  if (!whatsapp) {
    throw new AppError("ERR_SESSION_NOT_ALLOWED", 404);
  }

  const results = [];

  try {
    for (const groupId of groupIds) {
      try {
        await ChangeGroupDescriptionService({
          description,
          whatsappId,
          groupId
        });

        results.push({
          groupId,
          status: "success"
        });

        await new Promise(resolve => setTimeout(resolve, randomDelay));
      } catch (err) {
        results.push({
          groupId,
          status: "error",
          error: err.message
        });
      }
    }

    return res.json(results);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao alterar descrições dos grupos" });
  }
};

export const changeTitles = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { title, whatsappId, groupIds } = req.body;

  const whatsapps = await ListWhatsAppsService(tenantId);
  const whatsapp = whatsapps.find(w => w.id === parseInt(whatsappId));

  if (!whatsapp) {
    throw new AppError("ERR_SESSION_NOT_ALLOWED", 404);
  }

  const results = [];

  try {
    for (const groupId of groupIds) {
      try {
        await ChangeGroupTitleService({
          title,
          whatsappId,
          groupId
        });

        results.push({
          groupId,
          status: "success"
        });

        await new Promise(resolve => setTimeout(resolve, randomDelay));
      } catch (err) {
        results.push({
          groupId,
          status: "error",
          error: err.message
        });
      }
    }

    return res.json(results);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao alterar títulos dos grupos" });
  }
};

export const changePicturesUrl = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { picture, whatsappId, groupIds } = req.body;

  const whatsapps = await ListWhatsAppsService(tenantId);
  const whatsapp = whatsapps.find(w => w.id === parseInt(whatsappId));

  if (!whatsapp) {
    throw new AppError("ERR_SESSION_NOT_ALLOWED", 404);
  }

  const results = [];

  try {
    for (const groupId of groupIds) {
      try {
        await ChangeGroupPictureService({
          picture,
          whatsappId,
          groupId
        });

        results.push({
          groupId,
          status: "success"
        });

        await new Promise(resolve => setTimeout(resolve, randomDelay));
      } catch (err) {
        results.push({
          groupId,
          status: "error",
          error: err.message
        });
      }
    }

    return res.json(results);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao alterar fotos dos grupos" });
  }
};

export const changePicturesFile = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { whatsappId, arrayGroupIds } = req.body;
  const file = req.file;

  const whatsapps = await ListWhatsAppsService(tenantId);
  const whatsapp = whatsapps.find(w => w.id === parseInt(whatsappId));

  if (!whatsapp) {
    throw new AppError("ERR_SESSION_NOT_ALLOWED", 404);
  }

  const results = [];

  try {
    for (const groupId of arrayGroupIds.split(',')) {
      try {
        const wppId = parseInt(whatsappId);
        const filePath = `./public/${tenantId}/${file.filename}`;

        await ChangeGroupPictureFileService({
          file: filePath,
          wppId,
          groupId
        });

        results.push({
          groupId,
          status: "success"
        });

        await new Promise(resolve => setTimeout(resolve, randomDelay));
      } catch (err) {
        results.push({
          groupId,
          status: "error",
          error: err.message
        });
      }
    }

    return res.json(results);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao alterar fotos dos grupos" });
  }
};

export const setAdminsOnlyForGroups = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { whatsappId, adminsOnly, groupIds } = req.body;

  const whatsapps = await ListWhatsAppsService(tenantId);
  const whatsapp = whatsapps.find(w => w.id === parseInt(whatsappId));

  if (!whatsapp) {
    throw new AppError("ERR_SESSION_NOT_ALLOWED", 404);
  }

  const results = [];

  try {
    for (const groupId of groupIds) {
      try {
        await SetAdminsMessagesOnlyGroupService({
          whatsappId,
          adminsOnly,
          groupId
        });

        results.push({
          groupId,
          status: "success"
        });

        await new Promise(resolve => setTimeout(resolve, randomDelay));
      } catch (err) {
        results.push({
          groupId,
          status: "error",
          error: err.message
        });
      }
    }

    return res.json(results);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao configurar mensagens apenas de admins" });
  }
};

export const promoteParticipantsInGroups = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { participants, whatsappId, groupIds } = req.body;

  const whatsapps = await ListWhatsAppsService(tenantId);
  const whatsapp = whatsapps.find(w => w.id === parseInt(whatsappId));

  if (!whatsapp) {
    throw new AppError("ERR_SESSION_NOT_ALLOWED", 404);
  }

  const results = [];

  try {
    for (const groupId of groupIds) {
      try {
        await PromoteGroupParticipantService({
          participants,
          whatsappId,
          groupId
        });

        results.push({
          groupId,
          status: "success"
        });

        await new Promise(resolve => setTimeout(resolve, randomDelay));
      } catch (err) {
        results.push({
          groupId,
          status: "error",
          error: err.message
        });
      }
    }

    return res.json(results);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao promover participantes nos grupos" });
  }
};

export const demoteParticipantsInGroups = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { participants, whatsappId, groupIds } = req.body;

  const whatsapps = await ListWhatsAppsService(tenantId);
  const whatsapp = whatsapps.find(w => w.id === parseInt(whatsappId));

  if (!whatsapp) {
    throw new AppError("ERR_SESSION_NOT_ALLOWED", 404);
  }

  const results = [];

  try {
    for (const groupId of groupIds) {
      try {
        await DemoteGroupParticipantService({
          participants,
          whatsappId,
          groupId
        });

        results.push({
          groupId,
          status: "success"
        });

        await new Promise(resolve => setTimeout(resolve, randomDelay));
      } catch (err) {
        results.push({
          groupId,
          status: "error",
          error: err.message
        });
      }
    }

    return res.json(results);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao rebaixar participantes nos grupos" });
  }
};

export const addParticipantsToGroups = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { participants, whatsappId, groupIds } = req.body;

  const whatsapps = await ListWhatsAppsService(tenantId);
  const whatsapp = whatsapps.find(w => w.id === parseInt(whatsappId));

  if (!whatsapp) {
    throw new AppError("ERR_SESSION_NOT_ALLOWED", 404);
  }

  const results = [];

  try {
    for (const groupId of groupIds) {
      try {
        await AddGroupParticipantService({
          participants,
          whatsappId,
          groupId
        });

        results.push({
          groupId,
          status: "success"
        });

        await new Promise(resolve => setTimeout(resolve, randomDelay));
      } catch (err) {
        results.push({
          groupId,
          status: "error",
          error: err.message
        });
      }
    }

    return res.json(results);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao adicionar participantes aos grupos" });
  }
};

export const removeParticipantsFromGroups = async (req: Request, res: Response): Promise<Response> => {
  const { tenantId } = req.user;
  const { participants, whatsappId, groupIds } = req.body;

  const whatsapps = await ListWhatsAppsService(tenantId);
  const whatsapp = whatsapps.find(w => w.id === parseInt(whatsappId));

  if (!whatsapp) {
    throw new AppError("ERR_SESSION_NOT_ALLOWED", 404);
  }

  const results = [];

  try {
    for (const groupId of groupIds) {
      try {
        await RemoveGroupParticipantService({
          participants,
          whatsappId,
          groupId
        });

        results.push({
          groupId,
          status: "success"
        });

        await new Promise(resolve => setTimeout(resolve, randomDelay));
      } catch (err) {
        results.push({
          groupId,
          status: "error",
          error: err.message
        });
      }
    }

    return res.json(results);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao remover participantes dos grupos" });
  }
};

// ... Continuar com as outras funções convertidas da mesma forma 