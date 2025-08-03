/**
 * Log rotation and retention configuration
 * Manages log files in production environments with proper rotation and cleanup
 */

export interface LogRotationConfig {
  enabled: boolean;
  directory: string;
  filename: string;
  maxFiles: string | number;
  maxSize: string;
  datePattern: string;
  zippedArchive: boolean;
  auditFile: string;
  frequency: string;
  utc: boolean;
}

export interface LogRetentionConfig {
  enabled: boolean;
  retentionDays: number;
  archiveRetentionDays: number;
  cleanupSchedule: string;
  compressionLevel: number;
}

/**
 * Default log rotation configuration
 */
export const defaultLogRotationConfig: LogRotationConfig = {
  enabled: process.env.NODE_ENV === 'production',
  directory: process.env['LOG_DIRECTORY'] || './logs',
  filename: 'culturemade-%DATE%.log',
  maxFiles: '30d', // Keep 30 days of logs
  maxSize: '20m', // Rotate when file reaches 20MB
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  auditFile: 'log-audit.json',
  frequency: '24h',
  utc: true,
};

/**
 * Default log retention configuration
 */
export const defaultLogRetentionConfig: LogRetentionConfig = {
  enabled: process.env.NODE_ENV === 'production',
  retentionDays: 30, // Keep logs for 30 days
  archiveRetentionDays: 90, // Keep archives for 90 days
  cleanupSchedule: '0 2 * * *', // Run cleanup at 2 AM daily
  compressionLevel: 6, // Good balance between compression and speed
};

/**
 * Environment-specific log configurations
 */
export const getLogConfigForEnvironment = () => {
  const env = (process.env.NODE_ENV as string) || 'development';

  if (env === 'production') {
    return {
      rotation: {
        ...defaultLogRotationConfig,
        maxFiles: '90d', // Keep more logs in production
        maxSize: '50m', // Larger files in production
      },
      retention: {
        ...defaultLogRetentionConfig,
        retentionDays: 90,
        archiveRetentionDays: 365, // Keep archives for a year
      },
    };
  }

  if (env === 'staging' || process.env['VERCEL_ENV'] === 'preview') {
    return {
      rotation: {
        ...defaultLogRotationConfig,
        maxFiles: '14d', // Keep 2 weeks of logs
        maxSize: '10m',
      },
      retention: {
        ...defaultLogRetentionConfig,
        retentionDays: 14,
        archiveRetentionDays: 30,
      },
    };
  }

  // development or default
  return {
    rotation: {
      ...defaultLogRotationConfig,
      enabled: false, // No rotation in development
    },
    retention: {
      ...defaultLogRetentionConfig,
      enabled: false, // No retention in development
    },
  };
};

/**
 * Log level configurations for different environments
 */
export const getLogLevelForEnvironment = () => {
  const env = (process.env.NODE_ENV as string) || 'development';

  if (env === 'production') {
    return 'info'; // Only info and above in production
  }

  if (env === 'staging' || process.env['VERCEL_ENV'] === 'preview') {
    return 'debug'; // Debug level for staging
  }

  if (env === 'test') {
    return 'silent'; // Silent during tests
  }

  // development or default
  return 'debug'; // Verbose logging in development
};

/**
 * Transport configurations for different environments
 */
export const getTransportConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  const config = getLogConfigForEnvironment();

  if (env === 'development') {
    // Pretty printing for development
    return {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
        messageFormat: '{levelname} [{module}] - {msg}',
        singleLine: false,
      },
    };
  }

  if (env === 'test') {
    // No transport for tests
    return undefined;
  }

  // Production/staging - structured JSON logs with rotation
  return {
    targets: [
      {
        target: 'pino/file',
        level: getLogLevelForEnvironment(),
        options: {
          destination: `${config.rotation.directory}/app.log`,
          mkdir: true,
        },
      },
      {
        target: 'pino/file',
        level: 'error',
        options: {
          destination: `${config.rotation.directory}/error.log`,
          mkdir: true,
        },
      },
      // Optional: Send logs to external service in production
      ...(process.env['LOG_EXTERNAL_ENDPOINT']
        ? [
            {
              target: '@logtail/pino',
              options: {
                sourceToken: process.env['LOG_EXTERNAL_ENDPOINT'],
              },
            },
          ]
        : []),
    ],
  };
};

/**
 * Cleanup old log files based on retention policy
 */
export async function cleanupOldLogs(config?: LogRetentionConfig) {
  if (process.env.NODE_ENV !== 'production') {
    return; // Only run in production
  }

  const retentionConfig = config || defaultLogRetentionConfig;

  if (!retentionConfig.enabled) {
    return;
  }

  try {
    const fs = await import('fs/promises');
    const path = await import('path');

    const logDir = process.env['LOG_DIRECTORY'] || './logs';
    const files = await fs.readdir(logDir);
    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(logDir, file);
      const stats = await fs.stat(filePath);
      const ageInDays = (now - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

      // Remove old log files
      if (file.endsWith('.log') && ageInDays > retentionConfig.retentionDays) {
        await fs.unlink(filePath);

      }

      // Remove old archive files
      if (
        file.endsWith('.gz') &&
        ageInDays > retentionConfig.archiveRetentionDays
      ) {
        await fs.unlink(filePath);

      }
    }
  } catch (error) {
    // Silent fail for cleanup
  }
}
