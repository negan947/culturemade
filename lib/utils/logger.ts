import pino from 'pino';

/**
 * Structured logging configuration using Pino
 * Provides consistent logging across the application with proper levels and formatting
 */

// Log levels based on RFC 5424
export const LOG_LEVELS = {
  FATAL: 60,
  ERROR: 50,
  WARN: 40,
  INFO: 30,
  DEBUG: 20,
  TRACE: 10,
} as const;

// Custom log level names
export type LogLevel = keyof typeof LOG_LEVELS;

/**
 * Configuration for different environments
 */
const getLoggerConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';

  const baseConfig = {
    name: 'culturemade',
    level: process.env['LOG_LEVEL'] || (isDevelopment ? 'debug' : 'info'),

    // Base logging configuration
    base: {
      pid: process.pid,
      hostname: process.env['HOSTNAME'] || 'unknown',
      env: process.env.NODE_ENV || 'development',
      version: process.env['npm_package_version'] || '1.0.0',
    },

    // Timestamp configuration
    timestamp: pino.stdTimeFunctions.isoTime,

    // Serializers for common objects
    serializers: {
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
    },

    // Redact sensitive information
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers["x-api-key"]',
        'req.body.password',
        'req.body.confirmPassword',
        'req.body.token',
        'res.headers["set-cookie"]',
        'password',
        'token',
        'apiKey',
        'secret',
        'credentials',
        'authorization',
        'cookie',
        'session',
      ],
      censor: '[REDACTED]',
    },

    // Custom formatters for specific fields
    formatters: {
      level: (label: string) => {
        return { level: label.toUpperCase() };
      },
      bindings: (bindings: any) => {
        return {
          pid: bindings.pid,
          hostname: bindings.hostname,
          service: 'culturemade',
        };
      },
    },
  };

  if (isDevelopment) {
    // Pretty printing for development
    return {
      ...baseConfig,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          messageFormat: '{levelname} - {msg}',
        },
      },
    };
  }

  if (isTest) {
    // Silent logging during tests
    return {
      ...baseConfig,
      level: 'silent',
    };
  }

  // Production configuration - structured JSON logs
  return baseConfig;
};

/**
 * Create the main logger instance
 */
export const logger = pino(getLoggerConfig());

/**
 * Create child loggers for specific modules
 */
export const createModuleLogger = (module: string) => {
  return logger.child({ module });
};

/**
 * Request logger for HTTP requests
 */
export const requestLogger = createModuleLogger('http');

/**
 * Database logger for database operations
 */
export const dbLogger = createModuleLogger('database');

/**
 * Auth logger for authentication operations
 */
export const authLogger = createModuleLogger('auth');

/**
 * API logger for API operations
 */
export const apiLogger = createModuleLogger('api');

/**
 * Error logger for error handling
 */
export const errorLogger = createModuleLogger('error');

/**
 * Performance logger for performance monitoring
 */
export const perfLogger = createModuleLogger('performance');

/**
 * Security logger for security events
 */
export const securityLogger = createModuleLogger('security');

/**
 * Business logic logger
 */
export const businessLogger = createModuleLogger('business');

/**
 * Utility functions for structured logging
 */

/**
 * Log function with structured data
 */
export function logWithContext(
  level: LogLevel,
  message: string,
  context?: Record<string, any>,
  moduleLogger?: pino.Logger
) {
  const loggerToUse = moduleLogger || logger;
  const logLevel = level.toLowerCase() as pino.Level;

  if (context) {
    loggerToUse[logLevel](context, message);
  } else {
    loggerToUse[logLevel](message);
  }
}

/**
 * Log HTTP request with timing
 */
export function logRequest(
  req: any,
  res: any,
  responseTime?: number,
  additionalContext?: Record<string, any>
) {
  const context = {
    req: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers?.['user-agent'],
    },
    res: {
      statusCode: res.statusCode,
      headers: res.getHeaders?.(),
    },
    responseTime: responseTime ? `${responseTime}ms` : undefined,
    ...additionalContext,
  };

  const level = res.statusCode >= 400 ? 'ERROR' : 'INFO';
  logWithContext(
    level,
    `${req.method} ${req.url} ${res.statusCode}`,
    context,
    requestLogger
  );
}

/**
 * Log database query with timing
 */
export function logDatabaseQuery(
  operation: string,
  table: string,
  duration?: number,
  error?: Error,
  additionalContext?: Record<string, any>
) {
  const context = {
    operation,
    table,
    duration: duration ? `${duration}ms` : undefined,
    error: error ? { message: error.message, stack: error.stack } : undefined,
    ...additionalContext,
  };

  const level = error ? 'ERROR' : 'DEBUG';
  const message = error
    ? `Database ${operation} failed on ${table}`
    : `Database ${operation} on ${table}`;

  logWithContext(level, message, context, dbLogger);
}

/**
 * Log authentication events
 */
export function logAuthEvent(
  event: string,
  userId?: string,
  success: boolean = true,
  additionalContext?: Record<string, any>
) {
  const context = {
    event,
    userId,
    success,
    ...additionalContext,
  };

  const level = success ? 'INFO' : 'WARN';
  const message = `Auth event: ${event}`;

  logWithContext(level, message, context, authLogger);
}

/**
 * Log security events
 */
export function logSecurityEvent(
  event: string,
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  details?: Record<string, any>
) {
  const context = {
    event,
    severity,
    timestamp: new Date().toISOString(),
    ...details,
  };

  const logLevel =
    severity === 'CRITICAL'
      ? 'FATAL'
      : severity === 'HIGH'
        ? 'ERROR'
        : severity === 'MEDIUM'
          ? 'WARN'
          : 'INFO';

  logWithContext(logLevel, `Security event: ${event}`, context, securityLogger);
}

/**
 * Log performance metrics
 */
export function logPerformance(
  operation: string,
  duration: number,
  additionalMetrics?: Record<string, any>
) {
  const context = {
    operation,
    duration: `${duration}ms`,
    ...additionalMetrics,
  };

  logWithContext('INFO', `Performance: ${operation}`, context, perfLogger);
}

/**
 * Log business events
 */
export function logBusinessEvent(
  event: string,
  entityType: string,
  entityId?: string,
  userId?: string,
  additionalContext?: Record<string, any>
) {
  const context = {
    event,
    entityType,
    entityId,
    userId,
    timestamp: new Date().toISOString(),
    ...additionalContext,
  };

  logWithContext('INFO', `Business event: ${event}`, context, businessLogger);
}

/**
 * Log API errors with proper context
 */
export function logApiError(
  error: Error,
  req?: any,
  additionalContext?: Record<string, any>
) {
  const context = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    req: req
      ? {
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: req.body,
        }
      : undefined,
    ...additionalContext,
  };

  logWithContext('ERROR', `API Error: ${error.message}`, context, errorLogger);
}

/**
 * Middleware for automatic request logging
 */
export function createRequestLoggerMiddleware() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();

    // Log request start
    logWithContext(
      'DEBUG',
      `Request started: ${req.method} ${req.url}`,
      {
        method: req.method,
        url: req.url,
        userAgent: req.headers?.['user-agent'],
        ip: req.ip,
      },
      requestLogger
    );

    // Hook into response finish
    const originalSend = res.send;
    res.send = function (body: any) {
      const duration = Date.now() - start;
      logRequest(req, res, duration);
      return originalSend.call(this, body);
    };

    next();
  };
}

/**
 * Export the default logger
 */
export default logger;
