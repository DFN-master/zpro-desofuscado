import Bull, { Queue, Job } from 'bull';
import QueueListenersZPRO from './QueueListenersZPRO';
import * as jobs from '../jobs/IndexZPRO';
import { customRetryStrategy } from './socketChat/UtilsZPRO';
import { redisConfCommon } from '../utils/functionsZPRO';

// Configurar senha Redis se existir na env
if (process.env.IO_REDIS_PASSWORD) {
  redisConfCommon.password = process.env.IO_REDIS_PASSWORD;
}

interface QueueJob {
  bull: Queue;
  name: string;
  handle: (job: Job) => Promise<any>;
  options?: Bull.JobOptions;
}

// Configuração do Redis
const redisConfig = {
  redis: {
    ...redisConfCommon,
    retryStrategy: customRetryStrategy,
    reconnectOnError: (err: Error): boolean => {
      console.error(err);
      return true;
    }
  }
};

// Criar filas a partir dos jobs
const queues: QueueJob[] = Object.values(jobs).map(job => ({
  bull: new Bull(job.name, redisConfig),
  name: job.name,
  handle: job.handle,
  options: job.options
}));

export default {
  queues,

  async removeJobs(queueName: string, pattern: string): Promise<void> {
    const queue = this.queues.find(q => q.name === queueName);
    
    if (!queue) {
      throw new Error(`Queue ${queueName} not exists`);
    }

    const jobs = await queue.bull.getJobs(['active', 'waiting']);
    const filteredJobs = jobs.filter(job => {
      return job.id?.startsWith(pattern);
    });

    await Promise.allSettled(
      filteredJobs.map(job => job.remove())
    );
  },

  async add(queueName: string, data: any): Promise<Job | Job[]> {
    const queue = this.queues.find(q => q.name === queueName);
    
    if (!queue) {
      throw new Error(`Queue ${queueName} not exists`);
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
  },

  async process(): Promise<void> {
    this.queues.forEach(async queue => {
      if (!(await queue.bull.isReady())) return;

      if (queue.handle) {
        queue.bull.process(1, queue.handle);
      }

      queue.bull
        .on('error', QueueListenersZPRO.onError)
        .on('failed', QueueListenersZPRO.onFailed) 
        .on('active', QueueListenersZPRO.onWaiting)
        .on('completed', QueueListenersZPRO.onCompleted)
        .on('removed', QueueListenersZPRO.onRemoved)
        .on('cleaned', QueueListenersZPRO.onClean)
        .on('stalled', QueueListenersZPRO.onStalled)
        .on('waiting', QueueListenersZPRO.onActive);
    });
  }
}; 