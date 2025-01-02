import Bull, { Queue, Job } from 'bull';
import * as jobs from '../jobs/IndexZPRO';
import { logger } from '../utils/_loggerZPRO';
import ConfigLoaderService from '../services/ConfigLoaderService/configLoaderServiceZPRO';
import { customRetryStrategy } from '../utils/UtilsZPRO';
import WhatsappModel from '../models/WhatsappZPRO';
import TenantModel from '../models/TenantZPRO';
import { redisConfCommon } from '../utils/functionsZPRO';

interface QueueJob {
  bull: Queue;
  name: string;
  handle: (job: Job) => Promise<void>;
  options?: any;
}

const config = new ConfigLoaderService();

const defaultJobOptions = {
  delay: config.redis.delay,
  attempts: {
    attempts: config.redis.attempts.attempts,
    backoff: config.redis.attempts.backoff
  },
  removeOnFail: true,
  removeOnComplete: true
};

const limiterOptions = {
  max: config.redis.limiter.max,
  duration: config.redis.limiter.duration
};

const stalledOptions = {
  stalledInterval: 1000,
  maxStalledCount: 1
};

const queueOptions = {
  defaultJobOptions,
  limiter: limiterOptions,
  settings: stalledOptions
};

const redisConfig = {
  redis: {
    ...redisConfCommon,
    retryStrategy: customRetryStrategy,
    reconnectOnError(err: Error): boolean {
      console.error(err);
      return true;
    }
  }
};

class QueueManager {
  private queues: QueueJob[] = [];

  async initialize(): Promise<void> {
    this.queues = await this.createQueues();
  }

  private async createQueues(): Promise<QueueJob[]> {
    logger.info('Creating queues...');

    const whatsapps = await WhatsappModel.findAll({
      where: {
        status: ['CONNECTED', 'QRCODE', 'STARTING']
      },
      include: [
        {
          model: TenantModel,
          where: { status: 'active' }
        }
      ]
    });

    const queues = whatsapps
      .map(whatsapp => {
        const whatsappId = whatsapp.id;
        
        return Object.values(jobs).map(job => ({
          bull: new Bull(job.name(whatsappId), redisConfig),
          name: job.name(whatsappId),
          handle: job.handle,
          options: job.options
        }));
      })
      .flat();

    return queues;
  }

  async add(queueName: string, data: any | any[]): Promise<Job | Job[]> {
    if (!this.queues) {
      throw new Error('Queues not initialized');
    }

    const queue = this.queues.find(q => q.name === queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    if (Array.isArray(data)) {
      const jobs = data.map(item => ({
        data: item,
        opts: {
          ...queue.options,
          ...(item?.options || {})
        }
      }));
      return queue.bull.addBulk(jobs);
    }

    return queue.bull.add(data, {
      ...queue.options,
      ...data.options
    });
  }

  async process(): Promise<void> {
    if (!this.queues) {
      throw new Error('Queues not initialized');
    }

    await Promise.all(
      this.queues.map(async queue => {
        const concurrency = queue.name.endsWith('-SendMessage') ? 1 : 2;
        
        queue.bull.process(concurrency, async (job: Job) => {
          try {
            await queue.handle(job);
          } catch (err) {
            logger.error(`Job failed: ${queue.name} ${job.data}`);
            logger.error(err);
          }
        });
      })
    );

    logger.info('Todos os workers foram iniciados.');
  }
}

export default new QueueManager(); 