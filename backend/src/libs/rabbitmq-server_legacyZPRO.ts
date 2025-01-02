import { Connection, Channel, connect, ConsumeMessage } from 'amqplib';
import { logger } from '../utils/loggerZPRO';
import { sleepRandomTime } from '../utils/sleepRandomTimeZPRO';

export class RabbitmqServer {
  private conn: Connection;
  private channel: Channel;
  private uri: string;

  constructor(uri: string) {
    this.uri = uri;
  }

  async start(): Promise<void> {
    this.conn = await connect(this.uri);
    this.channel = await this.conn.createChannel();

    await this.channel.assertQueue('messenger', { durable: true });
    await this.channel.assertQueue('waba360', { durable: true });
  }

  async publishInExchange(exchange: string, message: any): Promise<boolean> {
    await this.channel.assertQueue(exchange, { durable: true });
    return this.channel.publish(
      exchange,
      '',
      Buffer.from(message),
      { persistent: true }
    );
  }

  async sendToQueue(queue: string, message: string, routingKey: string): Promise<boolean> {
    return this.channel.publish(
      queue,
      routingKey,
      Buffer.from(message),
      { persistent: true }
    );
  }

  async consumeWhatsapp(queue: string, callback: (message: any) => Promise<void>): Promise<void> {
    this.channel.prefetch(1, false);
    
    await this.channel.assertQueue(queue, { durable: true });
    
    this.channel.consume(queue, async (message: ConsumeMessage | null) => {
      try {
        if (message) {
          await callback(message);
          
          await sleepRandomTime({
            minMilliseconds: Number(process.env.MIN_SLEEP_INTERVAL || 3000),
            maxMilliseconds: Number(process.env.MAX_SLEEP_INTERVAL || 7000)
          });
          
          this.channel.ack(message);
        }
      } catch (error) {
        if (message) {
          this.channel.nack(message);
        }
        logger.error('::: Z-PRO ::: consumeWhatsapp', error);
      }
    });
  }

  async consume(queue: string, callback: (message: ConsumeMessage) => void): Promise<void> {
    return this.channel.consume(queue, (message: ConsumeMessage | null) => {
      try {
        if (message) {
          callback(message);
          this.channel.ack(message);
        }
      } catch (error) {
        logger.error(error);
      }
    });
  }
} 