import { Request } from 'express';
import WhatsApp from '../models/WhatsappZPRO';
import axios from 'axios';
import db from '../database/indexZPRO';
import { QueryTypes } from 'sequelize';
import { getIO } from '../libs/socketZPRO';
import logger from '../utils/loggerZPRO';
import { showWuzapiHost } from './ShowWuzapiHostZPRO';

interface WhatsAppInstance {
  id: number;
  wabaId: string;
  status: string;
  number: string;
  update(data: any): Promise<void>;
}

export const getMeowStatus = async (whatsapp: WhatsAppInstance): Promise<void> => {
  const io = getIO();
  const baseUrl = await showWuzapiHost(whatsapp.tenantId);

  try {
    const statusUrl = `${baseUrl}/session/status`;
    const headers = {
      'Content-Type': 'application/json',
      token: whatsapp.wabaId
    };

    const response = await axios.post(statusUrl, { headers });

    // Verifica se o status da resposta é válido
    if (!response.data.data.connected || !response.data.data.LoggedIn) {
      await whatsapp.update({ status: 'DISCONNECTED' });
      io.emit(`${whatsapp.tenantId}:whatsapp`, {
        action: 'update',
        whatsapp
      });
      return;
    }

    // Atualiza status do usuário para conectado
    const updateUserQuery = `
      UPDATE users 
      SET connected = 1 
      WHERE name = :replacements
    `;

    await db.query(updateUserQuery, {
      type: QueryTypes.UPDATE,
      replacements: [whatsapp.wabaId]
    });

    await whatsapp.update({ status: 'CONNECTED' });

    // Busca JID do usuário
    let userJid: string;
    const findJidQuery = `
      SELECT jid 
      FROM users 
      WHERE name = :replacements
    `;

    const [jidResult] = await db.query(findJidQuery, {
      type: QueryTypes.SELECT,
      replacements: [whatsapp.number]
    });

    if (jidResult && jidResult.jid) {
      userJid = jidResult.jid.split(':')[0];
      await whatsapp.update({ number: userJid });
    } else {
      logger.warn('JID não encontrado');
    }

    // Atualiza avatar do usuário
    const avatarUrl = `${baseUrl}/user/avatar`;
    const whatsappData = await WhatsApp.findOne({ where: { id: whatsapp.id }});

    try {
      const avatarPayload = {
        Phone: `${whatsappData.number}`,
        Preview: true
      };

      const avatarResponse = await axios.post(avatarUrl, avatarPayload, { headers });
      await whatsapp.update({ 
        profilePic: avatarResponse.data.data.url 
      });

    } catch (error) {
      logger.warn('Erro ao buscar foto do perfil');
    }

    // Emite evento de atualização
    io.emit(`${whatsapp.tenantId}:whatsapp`, {
      action: 'update',
      whatsapp
    });

    logger.info('Status MEOW atualizado com sucesso');

  } catch (error) {
    await whatsapp.update({ status: 'DISCONNECTED' });
    
    io.emit(`${whatsapp.tenantId}:whatsapp`, {
      action: 'update',
      whatsapp
    });

    logger.error(`Erro ao configurar status MEOW para ID ${whatsapp.id}: ${error}`);
  }
}; 