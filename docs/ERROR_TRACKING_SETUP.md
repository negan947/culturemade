# Error Tracking and Logging Setup

This document provides comprehensive information about the error tracking and structured logging system implemented in CultureMade (Step 0.2.1).

## 🎯 Overview

The error tracking system includes:
- **Sentry Integration**: Production-ready error tracking and performance monitoring
- **Structured Logging**: Pino-based logging with proper log levels and formatting
- **Error Boundaries**: React error boundaries at multiple levels
- **Log Management**: Rotation, retention, and cleanup policies
- **Testing Suite**: Comprehensive tests for all logging components

## 🚀 Quick Start

### 1. Environment Configuration

Add these environment variables to your `.env.local`:

```bash
# Sentry Configuration (Required for production)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ORG=your-organization
SENTRY_PROJECT=your-project-name

# Logging Configuration (Optional)
LOG_LEVEL=debug  # trace|debug|info|warn|error|fatal
NODE_ENV=development

# Analytics (Optional)
VERCEL_ANALYTICS_ID=your-analytics-id
```

### 2. Testing the Setup

Visit `/test-error-tracking` in your application to run the test suite or call the API directly:

```bash
# Quick test
curl http://localhost:3000/api/test-error-tracking?type=quick

# Full test suite
curl http://localhost:3000/api/test-error-tracking?type=all
```

## 📚 Usage Guide

### Structured Logging

```typescript
import {
  logger,
  logAuthEvent,
  logDatabaseQuery,
  logApiError,
  logSecurityEvent,
  logPerformance,
  logBusinessEvent
} from '@/lib/utils/logger';

// Basic logging
logger.info('User logged in', { userId: '123', provider: 'google' });
logger.error('Database connection failed', { error: error.message });

// Specialized loggers
logAuthEvent('login', 'user-123', true, { provider: 'google' });
logDatabaseQuery('select', 'users', 150, undefined, { query: 'SELECT * FROM users' });
logApiError(error, request, { additionalContext: 'value' });
logSecurityEvent('failed_login', 'MEDIUM', { ip: '192.168.1.1' });
logPerformance('api_call', 250, { endpoint: '/api/users' });
logBusinessEvent('purchase', 'order', 'order-123', 'user-456', { amount: 99.99 });
```

### Sentry Integration

```typescript
import {
  withSentry,
  setSentryUser,
  captureSentryException,
  addSentryBreadcrumb,
  withDatabaseSpan
} from '@/lib/utils/sentry';

// Wrap API routes
export const GET = withSentry(async (request) => {
  // Your API logic here
  return NextResponse.json({ success: true });
}, {
  name: 'custom-api-name',
  tags: { feature: 'user-management' }
});

// Set user context
setSentryUser({
  id: user.id,
  username: user.username,
  email: user.email // Will be filtered out for privacy
});

// Track database operations
const users = await withDatabaseSpan(
  'select',
  'SELECT * FROM users WHERE active = true',
  () => database.users.findMany({ where: { active: true } })
);

// Add debugging breadcrumbs
addSentryBreadcrumb('User started checkout', 'user-action', 'info', {
  cartItems: 3,
  totalAmount: 299.99
});

// Capture exceptions with context
try {
  await riskyOperation();
} catch (error) {
  captureSentryException(error, {
    tags: { feature: 'checkout', critical: 'true' },
    extra: { userId: user.id, cartId: cart.id }
  });
}
```

### Error Boundaries

Error boundaries are automatically applied at multiple levels:

1. **App Level** (`app/layout.tsx`): Catches all unhandled errors
2. **Page Level** (`app/page.tsx`): Catches page-specific errors
3. **Component Level**: Wrap critical components

```typescript
import { ErrorBoundary } from '@/components/error/error-boundary';

function CriticalComponent() {
  return (
    <ErrorBoundary level="component" fallback="custom">
      <YourComponent />
    </ErrorBoundary>
  );
}
```

## 🛠 Configuration

### Log Levels

| Level | When to Use | Production |
|-------|-------------|------------|
| `trace` | Detailed debugging | ❌ |
| `debug` | Development debugging | ❌ |
| `info` | General information | ✅ |
| `warn` | Warnings and deprecations | ✅ |
| `error` | Recoverable errors | ✅ |
| `fatal` | Critical system failures | ✅ |

### Environment-Specific Behavior

#### Development
- Pretty-printed logs with colors
- All log levels enabled
- Detailed error stack traces
- Sentry in debug mode (if configured)

#### Production
- Structured JSON logs
- Info level and above
- Sensitive data redaction
- Full Sentry integration
- Log retention policies active

#### Test
- Silent logging (level: 'silent')
- No external service calls
- Mock Sentry integration

### Log Retention Policies

| Environment | Retention Period | Rotation |
|-------------|------------------|----------|
| Production | 90 days | Daily |
| Staging | 14 days | Daily |
| Development | No rotation | No limit |

## 🔧 Troubleshooting

### Common Issues

#### 1. Sentry Not Capturing Errors

**Symptoms:** Errors occur but don't appear in Sentry dashboard

**Solutions:**
- Verify `SENTRY_DSN` is correctly configured
- Check that Sentry is initialized in config files
- Ensure error is being thrown in a Sentry-wrapped context
- Check Sentry quota limits

```typescript
// Debug Sentry configuration
console.log('Sentry DSN:', process.env.SENTRY_DSN?.substring(0, 20) + '...');
```

#### 2. Logs Not Appearing

**Symptoms:** Console logs work but structured logs don't appear

**Solutions:**
- Check `LOG_LEVEL` environment variable
- Verify logger import path is correct
- Ensure development transport is configured
- Check for async logging issues

```typescript
// Test basic logging
import { logger } from '@/lib/utils/logger';
logger.error('Test error log'); // Should always appear
```

#### 3. Performance Issues

**Symptoms:** Application slow after logging setup

**Solutions:**
- Reduce log level in production (`info` or higher)
- Check for synchronous logging operations
- Verify log rotation is working
- Monitor disk space usage

#### 4. Error Boundaries Not Catching Errors

**Symptoms:** Errors crash the app instead of showing fallback UI

**Solutions:**
- Ensure errors are thrown in render phase
- Check that error boundaries are properly nested
- Verify React version compatibility
- Test with async errors (use `captureSentryException`)

### Testing Commands

```bash
# Run type checking
npm run type-check

# Test specific logging functionality
node -e "require('./lib/utils/logger').logger.info('Test message')"

# Check error boundary rendering
# Navigate to /test-error-tracking and click "Test Error Boundary"

# Verify Sentry configuration
# Check browser network tab for Sentry requests
```

## 📊 Monitoring and Alerts

### Key Metrics to Monitor

1. **Error Rate**: Percentage of requests resulting in errors
2. **Response Time**: P95 and P99 response times
3. **Log Volume**: Number of logs per minute/hour
4. **Error Types**: Most common error patterns
5. **User Impact**: Number of users affected by errors

### Recommended Alerts

```yaml
# Example alert configurations (adapt to your monitoring system)
- name: High Error Rate
  condition: error_rate > 5%
  duration: 5m

- name: Slow Response Time
  condition: p95_response_time > 2s
  duration: 10m

- name: Critical Error
  condition: fatal_errors > 0
  duration: 1m

- name: High Log Volume
  condition: logs_per_minute > 1000
  duration: 15m
```

## 📁 File Structure

```
lib/
├── utils/
│   ├── logger.ts          # Structured logging with Pino
│   ├── sentry.ts          # Sentry integration utilities
│   └── test-logging.ts    # Comprehensive test suite
├── config/
│   └── logging.ts         # Log rotation and retention
components/
└── error/
    └── error-boundary.tsx # React error boundaries
app/
├── api/
│   └── test-error-tracking/
│       └── route.ts       # Test API endpoint
└── test-error-tracking/
    └── page.tsx           # Test UI page
docs/
└── ERROR_TRACKING_SETUP.md # This documentation
```

## 🔐 Security Considerations

### Data Redaction

Sensitive information is automatically redacted from logs:

- Passwords and authentication tokens
- API keys and secrets
- Personal identification information
- Credit card numbers
- Session cookies

### Log Access Control

- Production logs should be access-controlled
- Use encryption for log storage
- Implement log retention policies
- Regular security audits of log content

### Privacy Compliance

- Email addresses are filtered from Sentry user context
- PII is redacted from error messages
- Geographic data is anonymized
- User consent for error tracking (if required by jurisdiction)

## 🚀 Advanced Usage

### Custom Log Transports

```typescript
// Add custom transport for external services
import { logger } from '@/lib/utils/logger';

const customTransport = pino.transport({
  target: 'pino-elasticsearch',
  options: {
    node: 'http://localhost:9200',
    index: 'culturemade-logs'
  }
});

// Use in production configuration
```

### Performance Monitoring

```typescript
import { withSentry } from '@/lib/utils/sentry';

// Monitor specific operations
export async function monitoredFunction() {
  return await withSentry(
    async () => {
      // Your code here
    },
    {
      name: 'custom-operation',
      op: 'function',
      tags: { component: 'checkout' }
    }
  );
}
```

### Custom Error Types

```typescript
class BusinessLogicError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'BusinessLogicError';
  }
}

// Usage with proper logging
try {
  throw new BusinessLogicError('Invalid discount code', 'INVALID_DISCOUNT');
} catch (error) {
  if (error instanceof BusinessLogicError) {
    logBusinessEvent('discount_error', 'discount', error.code, userId, {
      errorCode: error.code,
      message: error.message
    });
  }
  captureSentryException(error);
}
```

## 📞 Support

For issues with this error tracking setup:

1. Check the troubleshooting section above
2. Review logs in `/test-error-tracking` page
3. Verify environment configuration
4. Test with minimal reproduction case

Remember: This setup is designed to be robust and fail gracefully. If logging fails, the application should continue to function normally.
