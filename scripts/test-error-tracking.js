#!/usr/bin/env node

/**
 * Test script for error tracking and logging setup
 * Run with: node scripts/test-error-tracking.js
 */

// Set up environment for testing
process.env.NODE_ENV = 'development';
process.env.LOG_LEVEL = 'debug';

async function main() {
  console.log('🚀 Starting Error Tracking and Logging Test Suite');
  console.log('='.repeat(60));

  try {
    // Dynamic import to handle ES modules
    const { runAllLoggingTests, quickTest } = await import(
      '../lib/utils/test-logging.js'
    );

    console.log('\n🔧 Running quick test first...');
    quickTest();

    console.log('\n🧪 Running comprehensive test suite...');
    const result = await runAllLoggingTests();

    console.log('\n' + '='.repeat(60));

    if (result.allPassed) {
      console.log('🎉 All error tracking and logging tests PASSED!');
      console.log('✅ Setup is ready for production use.');
      process.exit(0);
    } else {
      console.log('⚠️  Some tests FAILED. Check the output above for details.');
      console.log('❌ Please fix the issues before proceeding.');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Test script failed to execute:');
    console.error(error.message);

    // Try alternative test approach
    console.log('\n🔄 Attempting alternative test method...');

    try {
      // Test basic logging functionality
      const { logger } = await import('../lib/utils/logger.js');
      logger.info('Basic logging test successful');

      console.log('✅ Basic logging functionality works');
      console.log('⚠️  Some advanced tests may require runtime configuration');
    } catch (altError) {
      console.error('❌ Alternative test also failed:', altError.message);
      console.log('\n💡 This might be expected if:');
      console.log('   • Sentry DSN is not configured (normal for development)');
      console.log('   • Some environment variables are missing');
      console.log('   • ES modules are not fully configured');
      console.log(
        '\nℹ️  Manual testing recommended after starting the application.'
      );
    }

    process.exit(1);
  }
}

main().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
