const os = require('os');
const { performance } = require('perf_hooks');
const databaseManager = require('../config/database');
const { logger, healthLogger, performanceLogger } = require('./logger');

class MonitoringSystem {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byMethod: {},
        byEndpoint: {},
        responseTimes: [],
      },
      database: {
        queries: 0,
        slowQueries: 0,
        errors: 0,
        connections: 0,
        responseTimes: [],
      },
      memory: {
        usage: [],
        gc: {
          count: 0,
          duration: 0,
        },
      },
      errors: {
        total: 0,
        byType: {},
        recent: [],
      },
      performance: {
        cpu: [],
        uptime: 0,
        startTime: Date.now(),
      },
    };

    this.alerts = [];
    this.thresholds = {
      memory: 0.9, // 90% memory usage
      cpu: 0.8, // 80% CPU usage
      responseTime: 5000, // 5 seconds
      errorRate: 0.05, // 5% error rate
      slowQueryRate: 0.1, // 10% slow queries
    };

    this.healthChecks = new Map();
    this.monitoringInterval = null;
    this.alertInterval = null;
  }

  // Initialize monitoring
  initialize() {
    logger.info('Initializing monitoring system');
    
    // Start monitoring intervals
    this.startSystemMonitoring();
    this.startHealthChecks();
    this.startAlertMonitoring();
    
    // Set up process monitoring
    this.setupProcessMonitoring();
    
    logger.info('Monitoring system initialized');
  }

  // Start system monitoring
  startSystemMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // Every 30 seconds
  }

  // Start health checks
  startHealthChecks() {
    // Database health check
    this.addHealthCheck('database', async () => {
      try {
        const health = await databaseManager.healthCheck();
        return {
          status: 'healthy',
          details: health,
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          details: { error: error.message },
        };
      }
    });

    // Memory health check
    this.addHealthCheck('memory', () => {
      const usage = process.memoryUsage();
      const memoryUsage = usage.heapUsed / usage.heapTotal;
      
      return {
        status: memoryUsage < this.thresholds.memory ? 'healthy' : 'warning',
        details: {
          heapUsed: usage.heapUsed,
          heapTotal: usage.heapTotal,
          memoryUsage: memoryUsage,
        },
      };
    });

    // CPU health check
    this.addHealthCheck('cpu', () => {
      const cpuUsage = os.loadavg()[0] / os.cpus().length;
      
      return {
        status: cpuUsage < this.thresholds.cpu ? 'healthy' : 'warning',
        details: {
          cpuUsage: cpuUsage,
          loadAverage: os.loadavg(),
        },
      };
    });

    // Run health checks every minute
    setInterval(async () => {
      await this.runHealthChecks();
    }, 60000);
  }

  // Start alert monitoring
  startAlertMonitoring() {
    this.alertInterval = setInterval(() => {
      this.checkAlerts();
    }, 60000); // Every minute
  }

  // Add health check
  addHealthCheck(name, checkFunction) {
    this.healthChecks.set(name, checkFunction);
  }

  // Run all health checks
  async runHealthChecks() {
    const results = {};
    
    for (const [name, checkFunction] of this.healthChecks) {
      try {
        const startTime = performance.now();
        const result = await checkFunction();
        const duration = performance.now() - startTime;
        
        results[name] = {
          ...result,
          duration: `${duration.toFixed(2)}ms`,
          timestamp: new Date().toISOString(),
        };
        
        healthLogger.serviceHealth(name, result.status, result.details);
      } catch (error) {
        results[name] = {
          status: 'error',
          details: { error: error.message },
          timestamp: new Date().toISOString(),
        };
        
        logger.error(`Health check failed for ${name}:`, error);
      }
    }
    
    return results;
  }

  // Collect system metrics
  collectSystemMetrics() {
    // Memory metrics
    const memoryUsage = process.memoryUsage();
    this.metrics.memory.usage.push({
      timestamp: Date.now(),
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      rss: memoryUsage.rss,
      external: memoryUsage.external,
    });

    // Keep only last 100 memory readings
    if (this.metrics.memory.usage.length > 100) {
      this.metrics.memory.usage = this.metrics.memory.usage.slice(-100);
    }

    // CPU metrics
    const cpuUsage = os.loadavg();
    this.metrics.performance.cpu.push({
      timestamp: Date.now(),
      loadAverage: cpuUsage,
    });

    // Keep only last 100 CPU readings
    if (this.metrics.performance.cpu.length > 100) {
      this.metrics.performance.cpu = this.metrics.performance.cpu.slice(-100);
    }

    // Update uptime
    this.metrics.performance.uptime = Date.now() - this.metrics.performance.startTime;

    // Log memory usage
    performanceLogger.memoryUsage(memoryUsage);
  }

  // Track request metrics
  trackRequest(method, endpoint, statusCode, duration, userId, tenantId) {
    this.metrics.requests.total++;
    
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    // Track by method
    this.metrics.requests.byMethod[method] = (this.metrics.requests.byMethod[method] || 0) + 1;

    // Track by endpoint
    this.metrics.requests.byEndpoint[endpoint] = (this.metrics.requests.byEndpoint[endpoint] || 0) + 1;

    // Track response times
    this.metrics.requests.responseTimes.push({
      timestamp: Date.now(),
      duration,
      method,
      endpoint,
      statusCode,
    });

    // Keep only last 1000 response times
    if (this.metrics.requests.responseTimes.length > 1000) {
      this.metrics.requests.responseTimes = this.metrics.requests.responseTimes.slice(-1000);
    }

    // Check for slow responses
    if (duration > this.thresholds.responseTime) {
      performanceLogger.apiResponse(endpoint, duration, statusCode);
    }
  }

  // Track database metrics
  trackDatabaseQuery(query, duration, success = true) {
    this.metrics.database.queries++;
    
    if (!success) {
      this.metrics.database.errors++;
    }

    if (duration > 1000) { // 1 second threshold
      this.metrics.database.slowQueries++;
      performanceLogger.slowQuery(query, duration);
    }

    this.metrics.database.responseTimes.push({
      timestamp: Date.now(),
      duration,
      success,
    });

    // Keep only last 1000 database response times
    if (this.metrics.database.responseTimes.length > 1000) {
      this.metrics.database.responseTimes = this.metrics.database.responseTimes.slice(-1000);
    }
  }

  // Track error
  trackError(error, type = 'application', context = {}) {
    this.metrics.errors.total++;
    this.metrics.errors.byType[type] = (this.metrics.errors.byType[type] || 0) + 1;

    this.metrics.errors.recent.push({
      timestamp: Date.now(),
      type,
      message: error.message,
      stack: error.stack,
      context,
    });

    // Keep only last 100 errors
    if (this.metrics.errors.recent.length > 100) {
      this.metrics.errors.recent = this.metrics.errors.recent.slice(-100);
    }
  }

  // Check alerts
  checkAlerts() {
    const alerts = [];

    // Memory alert
    const currentMemoryUsage = this.getCurrentMemoryUsage();
    if (currentMemoryUsage > this.thresholds.memory) {
      alerts.push({
        type: 'memory',
        severity: 'warning',
        message: `High memory usage: ${(currentMemoryUsage * 100).toFixed(2)}%`,
        value: currentMemoryUsage,
        threshold: this.thresholds.memory,
        timestamp: new Date().toISOString(),
      });
    }

    // CPU alert
    const currentCpuUsage = this.getCurrentCpuUsage();
    if (currentCpuUsage > this.thresholds.cpu) {
      alerts.push({
        type: 'cpu',
        severity: 'warning',
        message: `High CPU usage: ${(currentCpuUsage * 100).toFixed(2)}%`,
        value: currentCpuUsage,
        threshold: this.thresholds.cpu,
        timestamp: new Date().toISOString(),
      });
    }

    // Error rate alert
    const errorRate = this.getErrorRate();
    if (errorRate > this.thresholds.errorRate) {
      alerts.push({
        type: 'error_rate',
        severity: 'critical',
        message: `High error rate: ${(errorRate * 100).toFixed(2)}%`,
        value: errorRate,
        threshold: this.thresholds.errorRate,
        timestamp: new Date().toISOString(),
      });
    }

    // Slow query rate alert
    const slowQueryRate = this.getSlowQueryRate();
    if (slowQueryRate > this.thresholds.slowQueryRate) {
      alerts.push({
        type: 'slow_queries',
        severity: 'warning',
        message: `High slow query rate: ${(slowQueryRate * 100).toFixed(2)}%`,
        value: slowQueryRate,
        threshold: this.thresholds.slowQueryRate,
        timestamp: new Date().toISOString(),
      });
    }

    // Add new alerts
    this.alerts.push(...alerts);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Log alerts
    alerts.forEach(alert => {
      logger.warn(`Alert: ${alert.message}`, alert);
    });

    return alerts;
  }

  // Setup process monitoring
  setupProcessMonitoring() {
    // Monitor uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.trackError(error, 'uncaught_exception');
      logger.error('Uncaught Exception:', error);
    });

    // Monitor unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.trackError(reason, 'unhandled_rejection');
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Monitor memory usage
    process.on('warning', (warning) => {
      if (warning.name === 'MaxListenersExceededWarning') {
        this.trackError(warning, 'max_listeners_exceeded');
      }
    });
  }

  // Get current memory usage
  getCurrentMemoryUsage() {
    if (this.metrics.memory.usage.length === 0) return 0;
    
    const latest = this.metrics.memory.usage[this.metrics.memory.usage.length - 1];
    return latest.heapUsed / latest.heapTotal;
  }

  // Get current CPU usage
  getCurrentCpuUsage() {
    if (this.metrics.performance.cpu.length === 0) return 0;
    
    const latest = this.metrics.performance.cpu[this.metrics.performance.cpu.length - 1];
    return latest.loadAverage[0] / os.cpus().length;
  }

  // Get error rate
  getErrorRate() {
    if (this.metrics.requests.total === 0) return 0;
    return this.metrics.requests.failed / this.metrics.requests.total;
  }

  // Get slow query rate
  getSlowQueryRate() {
    if (this.metrics.database.queries === 0) return 0;
    return this.metrics.database.slowQueries / this.metrics.database.queries;
  }

  // Get metrics summary
  getMetricsSummary() {
    const avgResponseTime = this.metrics.requests.responseTimes.length > 0
      ? this.metrics.requests.responseTimes.reduce((sum, rt) => sum + rt.duration, 0) / this.metrics.requests.responseTimes.length
      : 0;

    const avgDbResponseTime = this.metrics.database.responseTimes.length > 0
      ? this.metrics.database.responseTimes.reduce((sum, rt) => sum + rt.duration, 0) / this.metrics.database.responseTimes.length
      : 0;

    return {
      requests: {
        total: this.metrics.requests.total,
        successful: this.metrics.requests.successful,
        failed: this.metrics.requests.failed,
        successRate: this.metrics.requests.total > 0 ? this.metrics.requests.successful / this.metrics.requests.total : 0,
        avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
        byMethod: this.metrics.requests.byMethod,
        byEndpoint: this.metrics.requests.byEndpoint,
      },
      database: {
        queries: this.metrics.database.queries,
        errors: this.metrics.database.errors,
        slowQueries: this.metrics.database.slowQueries,
        avgResponseTime: `${avgDbResponseTime.toFixed(2)}ms`,
        errorRate: this.metrics.database.queries > 0 ? this.metrics.database.errors / this.metrics.database.queries : 0,
      },
      memory: {
        currentUsage: this.getCurrentMemoryUsage(),
        avgUsage: this.metrics.memory.usage.length > 0
          ? this.metrics.memory.usage.reduce((sum, m) => sum + (m.heapUsed / m.heapTotal), 0) / this.metrics.memory.usage.length
          : 0,
      },
      performance: {
        uptime: this.metrics.performance.uptime,
        cpuUsage: this.getCurrentCpuUsage(),
      },
      errors: {
        total: this.metrics.errors.total,
        byType: this.metrics.errors.byType,
        recent: this.metrics.errors.recent.slice(-10), // Last 10 errors
      },
      alerts: this.alerts.slice(-10), // Last 10 alerts
    };
  }

  // Get detailed metrics
  getDetailedMetrics() {
    return {
      ...this.metrics,
      summary: this.getMetricsSummary(),
      thresholds: this.thresholds,
      timestamp: new Date().toISOString(),
    };
  }

  // Update thresholds
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('Monitoring thresholds updated', this.thresholds);
  }

  // Stop monitoring
  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    if (this.alertInterval) {
      clearInterval(this.alertInterval);
    }
    logger.info('Monitoring system stopped');
  }
}

// Create singleton instance
const monitoringSystem = new MonitoringSystem();

// Export monitoring utilities
module.exports = {
  monitoringSystem,
  MonitoringSystem,
}; 