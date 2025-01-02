import { IgApiClient } from 'instagram-private-api';
import { withFbnsAndRealtime } from 'instagram_mqtt';
import AppErrorZPRO from '../errors/AppErrorZPRO';
import { logger } from '../utils/loggerZPRO';

interface InstaBotSession {
  id: string;
  instagramUser: string;
  instagramKey: string;
  session?: string;
  update: (data: Partial<InstaBotSession>) => Promise<void>;
}

interface IgClientExtended extends IgApiClient {
  id?: string;
  accountLogin?: any;
}

const sessions: IgClientExtended[] = [];

export const initInstaBot = async (data: InstaBotSession): Promise<IgClientExtended> => {
  try {
    let state;
    let auth;
    
    const username = '@' + data.instagramUser;
    const password = data.instagramKey;

    if (!username || !password) {
      throw new Error('Not credentials');
    }

    if (data?.session) {
      state = JSON.parse(data.session);
    }

    const ig = withFbnsAndRealtime(new IgApiClient());
    ig.id = data.id;
    ig.state.generateDevice(username);

    if (data.session) {
      const { accountLogin } = ig;
      await ig.importState(JSON.parse(data.session));
      ig.accountLogin = accountLogin;
    } else {
      auth = await ig.account.login(username, password);
      ig.accountLogin = auth;
      state = await ig.exportState();
      
      await data.update({ session: state });

      process.nextTick(async () => {
        await ig.simulate.postLoginFlow();
      });
    }

    await ig.realtime.connect({
      irisData: await ig.feed.directInbox().request()
    });

    await ig.fbns.connect({
      autoReconnect: true
    });

    const sessionIndex = sessions.findIndex(s => s.id === data.id);

    if (sessionIndex === -1) {
      ig.id = data.id;
      if (!ig.accountLogin) {
        ig.accountLogin = await ig.account.currentUser();
      }
      sessions.push(ig);
    } else {
      ig.id = data.id;
      if (!ig.accountLogin) {
        ig.accountLogin = await ig.account.currentUser();
      }
      sessions[sessionIndex] = ig;
    }

    return ig;

  } catch (error) {
    logger.warn(`::: Z-PRO ::: ZDG ::: : initWbot | Error: ${error}`);
    throw new AppErrorZPRO(`${error}`, 400);
  }
};

export const getInstaBot = (id: string): IgClientExtended | undefined => {
  const sessionIndex = sessions.findIndex(s => s.id === id);
  return sessions[sessionIndex];
};

export const removeInstaBot = async (data: InstaBotSession): Promise<void> => {
  try {
    const sessionIndex = sessions.findIndex(s => s.id === data.id);
    
    if (sessionIndex !== -1) {
      sessions[sessionIndex].account.logout();
      sessions[sessionIndex].realtime.disconnect();
      sessions[sessionIndex].fbns.disconnect();
      sessions.splice(sessionIndex, 1);
    }

    await data.update({ session: '' });
    
  } catch (error) {
    logger.warn(`::: Z-PRO ::: ZDG ::: removeWbot | Error: ${error}`);
  }
}; 