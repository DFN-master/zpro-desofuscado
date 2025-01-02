import { Message as WhatsappMessage } from '@whiskeysockets/baileys';
import socketEmitZPRO from '../../helpers/socket-emit/EmitZPRO';
import TicketZPRO from '../../models/TicketZPRO';
import CreateMessageSystemServiceZPRO from '../MessageServices/CreateMessageSystemServiceZPRO';
import CreateLogTicketServiceZPRO from '../TicketServices/CreateLogTicketServiceZPRO';
import * as BuildSendMessageServiceZPRO from './BuildSendMessageServiceZPRO';
import DefinedUserBotServiceZPRO from './DefinedUserBotServiceZPRO';
import IsContactTestZPRO from './IsContactTestZPRO';
import ShowTicketServiceZPRO from '../TicketServices/ShowTicketServiceZPRO';
import { getBodyMessage } from '../../helpers/CheckIsValidBaileysContactZPRO';
import MessageZPRO from '../../models/MessageZPRO';
import CheckIsValidBaileysContactZPRO from '../../helpers/CheckIsValidBaileysContactZPRO';
import { getWbotBaileysZPRO } from '../WbotServices/wbot-baileysZPRO';
import CreateMessageServiceZPRO from '../MessageServices/CreateMessageServiceZPRO';
import AppErrorZPRO from '../../errors/AppErrorZPRO';

// Interfaces
interface ITicket {
  id: number;
  status: string;
  isGroup: boolean;
  unreadMessages: number;
  channel: string;
  whatsappId: number;
  chatFlowId: number | null;
  stepChatFlow: string | null;
  botRetries: number;
  lastInteractionBot: Date;
  answered: boolean;
  queueId: number | null;
  userId: number | null;
  tenantId: number;
  firstCall: boolean;
  notOptions?: boolean;
  autoClose?: boolean;
  closedAt?: number;
  chatgptStatus?: boolean;
  dialogflowStatus?: boolean;
  n8nStatus?: boolean;
  contact: {
    id: number;
    number: string;
  };
  whatsapp: {
    id: number;
  };
  update: (data: Partial<ITicket>) => Promise<void>;
  reload: () => Promise<void>;
  getChatFlow: () => Promise<IChatFlow>;
}

interface IMessage extends WhatsappMessage {
  key: {
    id: string;
    remoteJid?: string;
    fromMe: boolean;
    participant?: string;
  };
  message?: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
    imageMessage?: {
      caption: string;
      jpegThumbnail?: Buffer;
      url?: string;
    };
    videoMessage?: {
      caption: string;
      jpegThumbnail?: Buffer;
      url?: string;
    };
  };
  messageTimestamp: number;
  body?: string;
  fromMe?: boolean;
  participant?: string;
}

interface IConfiguration {
  welcomeMessage: {
    value: string;
    enabled?: boolean;
    delay?: number;
  };
  farewellMessage: {
    value: string;
    enabled?: boolean;
    delay?: number;
  };
  retryMessage: {
    value: string;
    type: number;
    destiny: any;
    enabled?: boolean;
    maxAttempts?: number;
  };
  firstInteraction?: {
    type: number;
    destiny: any;
    enabled?: boolean;
    timeout?: number;
  };
  answerCloseTicket?: {
    conditions: string[];
    enabled?: boolean;
    autoClose?: boolean;
  };
  maxRetryBot: number;
  timeoutBot?: number;
  integrations?: {
    chatgpt?: boolean;
    dialogflow?: boolean;
    n8n?: boolean;
  };
  queueAfterBot?: number;
  userAfterBot?: number;
}

interface INode {
  id: string;
  type: string;
  interactions: Array<{
    payload: {
      text?: string;
      caption?: string;
      filename?: string;
      buttons?: Array<{
        buttonText: {
          displayText: string;
        };
        buttonId: string;
      }>;
      sections?: Array<{
        title: string;
        rows: Array<{
          title: string;
          description?: string;
          rowId: string;
        }>;
      }>;
    };
    id: string;
    type: string;
    delay?: number;
    condition?: string[];
  }>;
  conditions: Array<{
    type: string;
    condition: string[];
    nextStepId: number;
    userIdDestination?: number;
    channelDestination?: {
      id: number;
      channel: string;
    };
    destiny?: any;
    answerClose?: string;
    queueId?: number;
  }>;
  position?: {
    x: number;
    y: number;
  };
  metadata?: {
    [key: string]: any;
  };
}

interface IChatFlow {
  nodeList: {
    nodes: INode[];
  };
  configuration: IConfiguration;
  celularTeste?: string;
}

interface IMessageData {
  messageId: string;
  ticketId: number;
  body: string;
  fromMe: boolean;
  read: boolean;
  mediaType?: string;
  timestamp: number;
  status: string;
  sendType: string;
  quotedMsgId?: string | null;
  contactId?: number;
}

interface ITicketLog {
  ticketId: number;
  type: string;
  queueId?: number;
  userId?: number;
  tenantId?: number;
}

type ActionType = 0 | 1 | 2 | 3; // 0=Queue, 1=User, 2=Channel, 3=Close

interface IAction {
  type: ActionType;
  nextStepId?: number;
  destiny?: any;
  userIdDestination?: number;
  channelDestination?: {
    id: number;
    channel: string;
  };
  answerClose?: string;
  id?: string;
}

interface IWbot {
  sendMessage: (
    contact: any, 
    message: {
      text?: string;
      image?: Buffer;
      video?: Buffer;
      audio?: Buffer;
      document?: Buffer;
      caption?: string;
      buttons?: any[];
      sections?: any[];
      footer?: string;
    }
  ) => Promise<any>;
  id?: number;
  status?: string;
  qrcode?: string;
  number?: string;
  isMultiDevice?: boolean;
  isGroupContact?: (jid: string) => boolean;
}

// Helper Functions
const sendWelcomeMessage = async (ticket: ITicket, chatFlow: IChatFlow): Promise<void> => {
  if (!chatFlow.configuration?.welcomeMessage?.value) return;

  const message = {
    body: chatFlow.configuration.welcomeMessage.value,
    fromMe: true,
    read: true
  };

  if (ticket.channel === 'whatsapp') {
    let sentMessage;
    const wbot = await getWbotBaileysZPRO(ticket.whatsapp.id);
    const contact = await CheckIsValidBaileysContactZPRO(ticket.contact.number, ticket.tenantId);

    sentMessage = await wbot.sendMessage(contact, { text: message.body });

    const messageData = {
      messageId: sentMessage.key.id || '',
      ticketId: ticket.id,
      body: message.body,
      fromMe: sentMessage.key.fromMe || false,
      read: sentMessage.key.fromMe || false,
      mediaType: BuildSendMessageServiceZPRO.getTypeMessage(sentMessage),
      timestamp: BuildSendMessageServiceZPRO.getTimestamp(sentMessage.messageTimestamp) * 1000,
      status: 'pending',
      sendType: 'bot'
    };

    await CreateMessageServiceZPRO.default({
      messageData,
      tenantId: ticket.tenantId
    });

  } else {
    await CreateMessageSystemServiceZPRO.default({
      msg: message,
      tenantId: ticket.tenantId,
      ticket,
      sendType: 'bot',
      status: 'pending'
    });
  }
};

const sendFarewellMessage = async (ticket: ITicket, chatFlow: IChatFlow): Promise<void> => {
  if (!chatFlow.configuration?.farewellMessage?.value) return;

  const message = {
    body: chatFlow.configuration.farewellMessage.value,
    fromMe: true,
    read: true
  };

  if (ticket.channel === 'whatsapp') {
    let sentMessage;
    const wbot = await getWbotBaileysZPRO(ticket.whatsapp.id);
    const contact = await CheckIsValidBaileysContactZPRO(ticket.contact.number, ticket.tenantId);

    sentMessage = await wbot.sendMessage(contact, { text: message.body });

    const messageData = {
      messageId: sentMessage.key.id || '',
      ticketId: ticket.id,
      body: message.body,
      fromMe: sentMessage.key.fromMe || false,
      read: sentMessage.key.fromMe || false,
      mediaType: BuildSendMessageServiceZPRO.getTypeMessage(sentMessage),
      timestamp: BuildSendMessageServiceZPRO.getTimestamp(sentMessage.messageTimestamp) * 1000,
      status: 'pending',
      sendType: 'bot'
    };

    await CreateMessageServiceZPRO.default({
      messageData,
      tenantId: ticket.tenantId
    });

  } else {
    await CreateMessageSystemServiceZPRO.default({
      msg: message,
      tenantId: ticket.tenantId,
      ticket,
      sendType: 'bot',
      status: 'pending'
    });
  }
};

const isQueueDefine = async (
  ticket: ITicket, 
  chatFlow: IChatFlow,
  currentNode: INode,
  action: IAction
): Promise<void> => {
  if (action.type === 0) {
    await ticket.update({
      queueId: action.destiny,
      chatFlowId: null,
      stepChatFlow: null,
      botRetries: 0,
      lastInteractionBot: new Date()
    });

    await CreateLogTicketServiceZPRO.default({
      ticketId: ticket.id,
      type: 'queue:create',
      queueId: action.destiny
    });

    await ticket.reload();

    socketEmitZPRO.default({
      tenantId: ticket.tenantId,
      type: 'ticket:update',
      payload: ticket
    });
  }
};

const isUserDefine = async (
  ticket: ITicket,
  action: IAction
): Promise<void> => {
  if (action.type === 1) {
    await ticket.update({
      userId: action.userIdDestination,
      chatFlowId: null,
      stepChatFlow: null,
      botRetries: 0,
      lastInteractionBot: new Date()
    });

    await ticket.reload();

    socketEmitZPRO.default({
      tenantId: ticket.tenantId,
      type: 'ticket:update',
      payload: ticket
    });

    await CreateLogTicketServiceZPRO.default({
      ticketId: ticket.id,
      userId: action.userIdDestination,
      type: 'userDefine'
    });
  }
};

const isChannelDefine = async (
  ticket: ITicket,
  action: IAction
): Promise<void> => {
  if (action.type === 2) {
    await ticket.update({
      whatsappId: action.channelDestination?.id,
      channel: action.channelDestination?.channel,
      chatFlowId: null,
      stepChatFlow: null,
      botRetries: 0,
      lastInteractionBot: new Date()
    });

    await ticket.reload();

    socketEmitZPRO.default({
      tenantId: ticket.tenantId,
      type: 'ticket:update',
      payload: ticket
    });
  }
};

const isCloseDefine = async (
  wbot: IWbot,
  ticket: ITicket,
  chatFlow: IChatFlow,
  action: IAction
): Promise<void> => {
  if (action.type === 3) {
    const closeMessage = [{
      payload: {
        text: action.answerClose
      },
      id: action.id,
      type: 'text:close'
    }];

    const message = closeMessage[0];

    await BuildSendMessageServiceZPRO.default({
      wbot,
      msg: message,
      tenantId: ticket.tenantId,
      ticket
    });

    await ticket.update({
      status: 'closed',
      chatFlowId: null,
      stepChatFlow: null,
      botRetries: 0,
      lastInteractionBot: new Date()
    });

    const updatedTicket = await ShowTicketServiceZPRO.default({
      id: ticket.id,
      tenantId: ticket.tenantId
    });

    socketEmitZPRO.default({
      tenantId: ticket.tenantId,
      type: 'ticket:update',
      payload: updatedTicket
    });
  }
};

const isNextSteps = async (
  wbot: IWbot,
  msg: IMessage,
  ticket: ITicket,
  chatFlow: IChatFlow,
  currentNode: INode,
  action: IAction
): Promise<void> => {
  if (action.nextStepId === 0) {
    await ticket.update({
      stepChatFlow: action.nextStepId,
      botRetries: 0,
      lastInteractionBot: new Date()
    });

    const nodes = [...chatFlow.nodeList.nodes];
    const nextNode = nodes.find(node => node.id === action.nextStepId);
    
    if (!nextNode) return;

    for (const interaction of nextNode.interactions) {
      await BuildSendMessageServiceZPRO.default({
        wbot,
        messageBody: msg,
        contact: interaction,
        tenantId: ticket.tenantId,
        ticket
      });
    }
  }
};

const isRetriesLimit = async (ticket: ITicket, chatFlow: IChatFlow): Promise<boolean> => {
  if (chatFlow.configuration?.maxRetryBot && 
      chatFlow.configuration.maxRetryBot > 0 && 
      ticket.botRetries >= chatFlow.configuration.maxRetryBot) {
    
    const action = chatFlow.configuration.retryMessage.type;
    const { destiny } = chatFlow.configuration.retryMessage;

    const updateData: Partial<ITicket> = {
      chatFlowId: null,
      stepChatFlow: null,
      botRetries: 0,
      lastInteractionBot: new Date()
    };

    const logData: ITicketLog = {
      ticketId: ticket.id,
      type: action === 0 ? 'queue:create' : 'userDefine'
    };

    if (action === 0) {
      updateData.queueId = destiny;
      logData.queueId = destiny;
    }

    if (action === 1) {
      updateData.userId = destiny;
      logData.userId = destiny;
    }

    if (action === 2) {
      updateData.whatsappId = destiny.id;
      updateData.channel = destiny.channel;
      logData.userId = destiny.id;
    }

    await ticket.update(updateData);

    socketEmitZPRO.default({
      tenantId: ticket.tenantId,
      type: 'ticket:update',
      payload: ticket
    });

    await CreateLogTicketServiceZPRO.default(logData);
    await sendWelcomeMessage(ticket, chatFlow);

    return true;
  }

  return false;
};

const isFirstInteraction = async (ticket: ITicket, chatFlow: IChatFlow): Promise<boolean> => {
  if (chatFlow.configuration?.firstInteraction) {
    const action = chatFlow.configuration.firstInteraction.type;
    const { destiny } = chatFlow.configuration.firstInteraction;

    const updateData: Partial<ITicket> = {
      botRetries: 0,
      lastInteractionBot: new Date()
    };

    const logData: ITicketLog = {
      ticketId: ticket.id,
      type: action === 0 ? 'queue:create:auto' : 'queue:create:manual'
    };

    if (action === 0) {
      updateData.queueId = destiny;
      logData.queueId = destiny;
      await ticket.update({ queueId: destiny });
    }

    if (action === 1) {
      updateData.userId = destiny;
      logData.userId = destiny;
      await ticket.update({ userId: destiny });
    }

    if (action === 2) {
      await ticket.update({ status: 'closed' });
    }

    if (action === 3) {
      updateData.chatFlowId = destiny.id;
      updateData.channel = destiny.channel;
      logData.userId = destiny.id;
      await ticket.update({ chatFlowId: destiny.id, channel: destiny.channel });
    }

    const updatedTicket = await ShowTicketServiceZPRO.default({
      id: ticket.id,
      tenantId: ticket.tenantId
    });

    socketEmitZPRO.default({
      tenantId: ticket.tenantId,
      type: 'ticket:update',
      payload: updatedTicket
    });

    return true;
  }

  return false;
};

const isAnswerCloseTicket = async (
  chatFlow: IChatFlow,
  ticket: ITicket,
  messageBody: string
): Promise<boolean> => {
  if (!chatFlow.configuration?.answerCloseTicket || 
      chatFlow.configuration.answerCloseTicket.conditions.length < 1) {
    return false;
  }

  const matchCondition = chatFlow.configuration.answerCloseTicket.conditions.find(
    condition => String(condition).trim() === String(messageBody).trim()
  );

  if (matchCondition) {
    await ticket.update({
      userId: 1,
      closedAt: new Date().getTime(),
      chatFlowId: null,
      stepChatFlow: null,
      botRetries: 0,
      lastInteractionBot: new Date(),
      unreadMessages: 0,
      answered: false,
      status: 'closed'
    });

    await sendFarewellMessage(ticket, chatFlow);

    await CreateLogTicketServiceZPRO.default({
      tenantId: ticket.tenantId,
      ticketId: ticket.id,
      type: 'closed'
    });

    await ticket.update({
      autoClose: true
    });

    socketEmitZPRO.default({
      tenantId: ticket.tenantId,
      type: 'ticket:update',
      payload: ticket
    });

    return true;
  }

  return false;
};

const VerifyStepsChatFlowTicket = async (
  wbot: IWbot,
  msg: IMessage,
  ticket: ITicket
): Promise<void> => {
  let celularTeste: string;

  const fromMe = ticket.channel === 'whatsapp' ? msg.key.fromMe : msg.fromMe;

  if (
    ticket.chatFlowId &&
    ticket.status === 'pending' &&
    !fromMe &&
    !ticket.isGroup &&
    !ticket.answered
  ) {
    if (ticket.chatFlowId) {
      const chatFlow = await ticket.getChatFlow();

      if (chatFlow.celularTeste) {
        celularTeste = chatFlow.celularTeste.replace(/\s/g, '');
      }

      const currentNode = chatFlow.nodeList.nodes.find(
        node => node.id === ticket.stepChatFlow
      );

      const configurationNode = chatFlow.nodeList.nodes.find(
        node => node.type === 'configuration'
      );

      const messageBody = ticket.channel === 'whatsapp' 
        ? String(msg.body).trim()
        : getBodyMessage(msg) || '';

      const action = currentNode.conditions.find(condition => {
        if (condition.type === 'US') return true;
        
        const conditions = condition.condition.map(c => String(c).trim());
        return conditions.includes(messageBody);
      });

      if (ticket.firstCall) {
        await isFirstInteraction(ticket, chatFlow);
        await ticket.update({ firstCall: false });
      }

      if (!ticket.answered && (await isAnswerCloseTicket(chatFlow, ticket, messageBody))) {
        return;
      }

      if (action && !ticket.answered) {
        if (action.type === 0 || action.type === 1) {
          await sendWelcomeMessage(ticket, chatFlow);
        }

        await isChannelDefine(ticket, action);
        await isNextSteps(wbot, msg, ticket, chatFlow, currentNode, action);
        await isQueueDefine(ticket, chatFlow, currentNode, action);
        await isUserDefine(ticket, action);
        await isCloseDefine(wbot, ticket, chatFlow, action);

        if (await IsContactTestZPRO.default(ticket.contact.number, celularTeste, ticket.channel)) {
          return;
        }

        socketEmitZPRO.default({
          tenantId: ticket.tenantId,
          type: 'ticket:update',
          payload: ticket
        });

      } else {
        if (await IsContactTestZPRO.default(ticket.contact.number, celularTeste, ticket.channel)) {
          return;
        }

        if (!ticket.answered) {
          if (await isRetriesLimit(ticket, chatFlow)) {
            return;
          }

          if (
            !ticket.queueId &&
            !ticket.chatgptStatus &&
            !ticket.dialogflowStatus &&
            !ticket.n8nStatus &&
            chatFlow.configuration.retryMessage.value !== ''
          ) {
            if (!ticket.notOptions) {
              const message = {
                body: chatFlow.configuration.retryMessage.value || 'Não entendi sua resposta. Vamos tentar novamente! Escolha uma opção válida.',
                fromMe: true,
                read: true
              };

              if (ticket.channel === 'whatsapp') {
                let sentMessage;
                const wbot = await getWbotBaileysZPRO(ticket.whatsapp.id);
                const contact = await CheckIsValidBaileysContactZPRO(
                  ticket.contact.number,
                  ticket.tenantId
                );

                sentMessage = await wbot.sendMessage(contact, {
                  text: message.body
                });

                const messageData = {
                  messageId: sentMessage.key.id || '',
                  ticketId: ticket.id,
                  body: message.body,
                  fromMe: sentMessage.key.fromMe || false,
                  read: sentMessage.key.fromMe || false,
                  mediaType: BuildSendMessageServiceZPRO.getTypeMessage(sentMessage),
                  timestamp: BuildSendMessageServiceZPRO.getTimestamp(sentMessage.messageTimestamp) * 1000,
                  status: 'pending',
                  sendType: 'bot'
                };

                await CreateMessageServiceZPRO.default({
                  messageData,
                  tenantId: ticket.tenantId
                });

              } else {
                await CreateMessageSystemServiceZPRO.default({
                  msg: message,
                  tenantId: ticket.tenantId,
                  ticket,
                  sendType: 'bot',
                  status: 'pending'
                });
              }
            }

            await ticket.update({
              notOptions: false
            });
          }

          await ticket.update({
            botRetries: ticket.botRetries + 1,
            lastInteractionBot: new Date()
          });
        }

        for (const interaction of currentNode.interactions) {
          await BuildSendMessageServiceZPRO.default({
            wbot,
            messageBody: msg,
            contact: interaction,
            tenantId: ticket.tenantId,
            ticket
          });
        }
      }
    }
  }
};

export default VerifyStepsChatFlowTicket; 