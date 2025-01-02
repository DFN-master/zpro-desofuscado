import axios from 'axios';
import { logger } from '../utils/loggerZPRO';

export enum ExecutionType {
  DELAY = 'DELAY',
  REPEAT = 'REPEAT'
}

interface JobData {
  id: string;
  data: any;
  opts: {
    attempts?: number;
    retryOptions?: {
      fallbackUrl?: string;
    };
  };
  attemptsMade: number;
}

export class QueueListener {
  static onError(error: Error): void {
    logger.error(error);
  }

  static onWaiting(_jobId: string): void {
    // Implementação do handler onWaiting
  }

  static onActive(_jobId: string, _jobJson: any): void {
    // Implementação do handler onActive
  }

  static onStalled(_job: any): void {
    // Implementação do handler onStalled
  }

  static onCompleted(_job: any, _result: any): void {
    // Implementação do handler onCompleted
  }

  static onFailed(job: JobData, error: Error): void {
    logger.warn(
      `::: Z-PRO ::: ZDG ::: Job with ID ${job.id} not executed. Attempts made ${job.attemptsMade}.`
    );

    if (job.opts.attempts && job.attemptsMade === job.opts.attempts) {
      const jobData = job.data;
      
      if (jobData.retryOptions?.fallbackUrl) {
        const payload = {
          id: job.id,
          error: error
        };
        
        const requestData = {
          ...jobData,
          ...payload
        };
        
        return axios.default.post(jobData.retryOptions.fallbackUrl, requestData);
      }
    }
  }

  static onRemoved(_job: any, _result: any): void {
    // Implementação do handler onRemoved
  }

  static onClean(_job: any): void {
    // Implementação do handler onClean
  }
} 