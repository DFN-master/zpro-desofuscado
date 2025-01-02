interface WebhookConfig {
  type: string;
  duration: number;
}

interface LimiterConfig {
  max: number;
  duration: number;
}

interface BackoffConfig {
  attempts: number;
  webhook: WebhookConfig;
  limiter: LimiterConfig;
}

interface ConfigResponse {
  backoff: BackoffConfig;
}

export function configLoader(): ConfigResponse {
  const webhookConfig: WebhookConfig = {
    type: 'exponential',
    duration: 1000 // 1 segundo
  };

  const limiterConfig: LimiterConfig = {
    max: 1,
    duration: 150 // 150 ms
  };

  const backoffConfig: BackoffConfig = {
    attempts: 3,
    webhook: webhookConfig,
    limiter: limiterConfig
  };

  return {
    backoff: backoffConfig
  };
} 