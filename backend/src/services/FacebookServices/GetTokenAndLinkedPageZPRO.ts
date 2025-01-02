import axios from 'axios';
import AppError from '../../errors/AppErrorZPRO';
import Whatsapp from '../../models/WhatsappZPRO';
import SetLogoutLinkedPage from './SetLogoutLinkedPageZPRO';
import { getIO } from '../../socketZPRO';

interface WhatsappData {
  id: number;
  [key: string]: any;
}

interface GetTokenAndLinkedPageParams {
  whatsapp: WhatsappData;
  accountId: string;
  userToken: string;
  tenantId: number;
}

interface FacebookPageInfo {
  id: string;
  access_token: string;
  [key: string]: any;
}

const API_VERSION = 'v${whatsappSession}';
const BASE_URL = 'https://graph.facebook.com/' + API_VERSION;
const APP_ID = process.env.FACEBOOK_APP_ID;
const APP_SECRET = process.env.FACEBOOK_APP_SECRET_KEY;

const getLongLivedAccessToken = async (userToken: string): Promise<string> => {
  const { data } = await axios.get(
    `${BASE_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${userToken}`
  );
  return data.access_token;
};

const getPermanentPageAccessToken = async (
  longLivedUserToken: string,
  accountId: string
): Promise<FacebookPageInfo> => {
  const { data: { data } } = await axios.get(
    `${BASE_URL}/${accountId}/accounts?access_token=${longLivedUserToken}`
  );

  if (!data.length || !data[0]) {
    throw new AppError('Nenhuma página encontrada', 400);
  }

  return data[0];
};

const getPageInfo = async (
  accountId: string, 
  userToken: string
): Promise<FacebookPageInfo[]> => {
  const url = `${BASE_URL}/${accountId}/accounts?limit=25&access_token=${userToken}`;
  
  const { data: { data } } = await axios({
    method: 'GET',
    url
  });

  return data;
};

const GetTokenAndLinkedPage = async ({
  whatsapp,
  accountId,
  userToken,
  tenantId
}: GetTokenAndLinkedPageParams): Promise<void> => {
  try {
    const io = getIO();

    // Buscar informações da página
    const pagesInfo = await getPageInfo(accountId, userToken);

    // Validar número de páginas
    if (pagesInfo.length > 1) {
      throw new AppError(
        'Escolha apenas 1 página. Refaça o processo e selecione apenas 1 página.',
        400
      );
    }

    // Se não encontrou páginas, fazer logout
    if (pagesInfo.length === 0) {
      await SetLogoutLinkedPage({
        whatsappId: whatsapp.id,
        tenantId
      });
      return;
    }

    // Gerar token de longa duração
    const longLivedUserToken = await getLongLivedAccessToken(userToken);

    // Obter token permanente da página
    const pageData = await getPermanentPageAccessToken(longLivedUserToken, accountId);

    // Preparar objeto com dados do Facebook
    const fbObject = {
      ...pageData,
      accountId,
      longLivedUserAccessToken: longLivedUserToken
    };

    // Preparar resposta
    const response = {
      status: 'CONNECTED',
      fbPageId: pageData.id,
      fbObject,
      tokenAPI: pageData.access_token
    };

    // Atualizar whatsapp
    await Whatsapp.update(response, {
      where: {
        id: whatsapp.id,
        tenantId
      }
    });

    // Emitir evento via socket
    io.emit(`${tenantId}:whatsappSession`, {
      action: 'update',
      session: {
        ...whatsapp,
        ...response
      }
    });

  } catch (err) {
    console.log(err);
    throw new AppError(err as string, 400);
  }
};

export default GetTokenAndLinkedPage; 