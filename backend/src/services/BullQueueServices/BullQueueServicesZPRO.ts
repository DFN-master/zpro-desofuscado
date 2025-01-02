import { Queue, Job } from 'bull';
import { logger } from '../../libs/loggerZPRO';
import { QueueZPRO_Dig } from '../../utils/QueueZPRO';

interface QueueStats {
  activeCount: number;
  waitingCount: number;
  failedCount: number;
  queueName?: string;
}

interface ReprocessResult {
  reprocessedCount: number;
}

interface QueueItem {
  name: string;
  bull: Queue;
}

/**
 * Reinicia o processamento de todas as filas
 */
const restartProcessJobs = async (): Promise<void> => {
  try {
    QueueZPRO_Dig.default.process();
  } catch (error: any) {
    logger.error('restartProcessJobs - Verify:', error.message);
  }
};

/**
 * Obtém estatísticas acumuladas de todas as filas
 */
const getQueueStatsAcc = async (): Promise<QueueStats> => {
  const queueStats = await Promise.all(
    QueueZPRO_Dig.default.queues.map(async (queue: QueueItem) => {
      const [activeCount, waitingCount, failedCount] = await Promise.all([
        queue.bull.getActiveCount(),
        queue.bull.getWaitingCount(),
        queue.bull.getFailedCount()
      ]);

      return {
        activeCount,
        waitingCount,
        failedCount
      };
    })
  );

  const initialStats: QueueStats = {
    activeCount: 0,
    waitingCount: 0,
    failedCount: 0
  };

  return queueStats.reduce((acc: QueueStats, curr: QueueStats) => {
    acc.activeCount += curr.activeCount;
    acc.waitingCount += curr.waitingCount;
    acc.failedCount += curr.failedCount;
    return acc;
  }, initialStats);
};

/**
 * Obtém estatísticas individuais de cada fila
 */
const getQueueStats = async (): Promise<QueueStats[]> => {
  const queueStats = await Promise.all(
    QueueZPRO_Dig.default.queues.map(async (queue: QueueItem) => {
      const [activeCount, waitingCount, failedCount] = await Promise.all([
        queue.bull.getActiveCount(),
        queue.bull.getWaitingCount(),
        queue.bull.getFailedCount()
      ]);

      return {
        queueName: queue.name,
        activeCount,
        waitingCount,
        failedCount
      };
    })
  );

  return queueStats;
};

/**
 * Reprocessa jobs que falharam em uma fila específica
 * @param queueName Nome da fila para reprocessar
 */
const reprocessFailedJobs = async (queueName: string): Promise<ReprocessResult> => {
  const queue = QueueZPRO_Dig.default.queues.find(
    (queue: QueueItem) => queue.name === queueName
  );

  if (!queue) {
    throw new Error(`Queue ${queueName} not found`);
  }

  const failedJobs: Job[] = await queue.bull.getFailed();
  await Promise.all(failedJobs.map((job: Job) => job.retry()));

  return {
    reprocessedCount: failedJobs.length
  };
};

export default {
  getQueueStats,
  reprocessFailedJobs,
  restartProcessJobs,
  getQueueStatsAcc
}; 