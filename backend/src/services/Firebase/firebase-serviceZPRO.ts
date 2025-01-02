import * as admin from 'firebase-admin';
import { logger } from '../../utils/loggerZPRO';

export enum NotificationEventType {
  CLEAN_UP = 'cleanUp',
  MESSAGE_CREATED = 'messageCreated'
}

export interface NotificationEvent {
  tenantId: string | number;
  ticketId: string | number;
  type: NotificationEventType;
  contact?: string;
  contactimageUrl?: string;
  messagebody?: string;
}

interface PushNotificationData {
  tenantId: string;
  ticketId: string;
  action: string;
  contact?: string;
  contactimageUrl?: string;
  messagebody?: string;
}

interface AndroidConfig {
  priority: string;
}

interface ApnsConfig {
  payload: {
    aps: {
      content_available: boolean;
    };
  };
}

interface NotificationMessage {
  topic: string;
  data: PushNotificationData & {
    content_available: string;
  };
  android: AndroidConfig;
  apns: ApnsConfig;
}

class PushNotificationDataFactory {
  private event: NotificationEvent;

  constructor(event: NotificationEvent) {
    this.event = event;
  }

  build(): PushNotificationData {
    switch (this.event.type) {
      case NotificationEventType.CLEAN_UP:
        return this.buildCleanUpData(this.event);
      case NotificationEventType.MESSAGE_CREATED:
        return this.buildMessageCreatedData(this.event);
      default:
        throw new Error('Notification type not supported');
    }
  }

  private buildMessageCreatedData({
    tenantId,
    ticketId,
    type,
    contact,
    contactimageUrl,
    messagebody
  }: NotificationEvent): PushNotificationData {
    return {
      tenantId: String(tenantId),
      ticketId: String(ticketId),
      action: String(type),
      contact,
      contactimageUrl,
      messagebody
    };
  }

  private buildCleanUpData({
    tenantId,
    ticketId,
    type
  }: NotificationEvent): PushNotificationData {
    return {
      tenantId: String(tenantId),
      ticketId: String(ticketId),
      action: String(type)
    };
  }
}

export class FirebaseService {
  constructor() {
    admin.initializeApp({
      credential: admin.credential.cert('firebase.json')
    });
  }

  async sendPushNotifications(event: NotificationEvent): Promise<void> {
    const { tenantId, type } = event;
    const notificationData = new PushNotificationDataFactory(event).build();

    try {
      const message: NotificationMessage = {
        topic: `tenant-${tenantId}`,
        data: {
          ...notificationData,
          content_available: 'true'
        },
        android: {
          priority: 'high'
        },
        apns: {
          payload: {
            aps: {
              content_available: true
            }
          }
        }
      };

      await admin.messaging().send(message);
    } catch (error) {
      logger.warn(':::: Z-PRO :::: ZDG :::: Error sending push notifications:', error);
      throw error;
    }
  }
} 