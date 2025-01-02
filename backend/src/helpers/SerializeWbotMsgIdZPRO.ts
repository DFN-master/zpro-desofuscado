interface MessageData {
  fromMe: boolean;
  contact: {
    number: string;
  };
  isGroup: boolean;
}

interface SessionData {
  id: string;
  fromMe: boolean;
}

const SerializeWbotMsgId = (message: MessageData, session: SessionData): string => {
  const serializedId = `${session.fromMe}_${message.contact.number}@${message.isGroup ? 'g' : 'c'}.us_${session.id}`;
  return serializedId;
};

export default SerializeWbotMsgId; 