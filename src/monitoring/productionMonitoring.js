/**
 * PRODUCTION MONITORING SYSTEM
 * Comprehensive monitoring, metrics, and observability for production deployment
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const productionConfig = require('../config/production');
const logger = require('../utils/logger');

class ProductionMonitoring {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byStatus: {},
        byRoute: {},
        byTenant: {}
      },
      performance: {
        responseTime: {
          min: Infinity,
          max: 0,
          avg: 0,
          p50: 0,
          p95: 0,
          p99: 0
        },
        throughput: 0,
        errorRate: 0
      },
      system: {
        memory: {
          used: 0,
          free: 0,
          total: 0,
          percentage: 0
        },
        cpu: {
          usage: 0,
          loadAverage: []
        },
        disk: {
          used: 0,
          free: 0,
          total: 0,
          percentage: 0
        }
      },
      database: {
        connections: {
          active: 0,
          idle: 0,
          total: 0
        },
        queries: {
          total: 0,
          slow: 0,
          errors: 0
        },
        performance: {
          avgQueryTime: 0,
          slowestQuery: null
        }
      },
      tenants: {
        active: 0,
        byTier: {},
        usage: {}
      }
    };

    this.startTime = Date.now();
    this.intervalId = null;
    this.startMonitoring();
  }

  /**
   * Start monitoring system
   */
  startMonitoring() {
    const config = productionConfig.getConfig();
    
    if (!config.monitoring.enabled) {
      logger.info('Monitoring disabled');
      return;
    }

    // Start system metrics collection
    this.intervalId = setInterval(() => {
      this.collectSystemMetrics();
      this.collectDatabaseMetrics();
      this.collectTenantMetrics();
    }, config.monitoring.healthCheck.interval || 30000);

    logger.info('Production monitoring started', {
      interval: config.monitoring.healthCheck.interval,
      metricsEnabled: config.monitoring.metrics.enabled
    });
  }

  /**
   * Stop monitoring system
   */
  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    logger.info('Production monitoring stopped');
  }

  /**
   * Record request metrics
   */
  recordRequest(req, res, responseTime) {
    const route = req.route?.path || req.path;
    const method = req.method;
    const statusCode = res.statusCode;
    const tenantId = req.tenantId || 'unknown';

    // Update request counters
    this.metrics.requests.total++;
    
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    // Update status code counters
    this.metrics.requests.byStatus[statusCode] = 
      (this.metrics.requests.byStatus[statusCode] || 0) + 1;

    // Update route counters
    const routeKey = `${method} ${route}`;
    this.metrics.requests.byRoute[routeKey] = 
      (this.metrics.requests.byRoute[routeKey] || 0) + 1;

    // Update tenant counters
    this.metrics.requests.byTenant[tenantId] = 
      (this.metrics.requests.byTenant[tenantId] || 0) + 1;

    // Update performance metrics
    this.updatePerformanceMetrics(responseTime);

    // Log slow requests
    if (responseTime > 5000) { // 5 seconds
      logger.warn('Slow request detected', {
        route: routeKey,
        responseTime,
        tenantId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
  }

  /**
   * Record database query metrics
   */
  recordDatabaseQuery(query, duration, error = null) {
    this.metrics.database.queries.total++;
    
    if (error) {
      this.metrics.database.queries.errors++;
    }

    if (duration > 1000) { // 1 second
      this.metrics.database.queries.slow++;
      
      if (!this.metrics.database.performance.slowestQuery || 
          duration > this.metrics.database.performance.slowestQuery.duration) {
        this.metrics.database.performance.slowestQuery = {
          query,
          duration,
          timestamp: new Date().toISOString()
        };
      }
    }

    // Update average query time
    const totalQueries = this.metrics.database.queries.total;
    const currentAvg = this.metrics.database.performance.avgQueryTime;
    this.metrics.database.performance.avgQueryTime = 
      (currentAvg * (totalQueries - 1) + duration) / totalQueries;
  }

  /**
   * Record error metrics
   */
  recordError(error, context = {}) {
    const errorType = error.name || 'UnknownError';
    const errorMessage = error.message || 'Unknown error';
    
    logger.error('Error recorded', {
      errorType,
      errorMessage,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });

    // Update error rate
    this.updateErrorRate();
  }

  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    try {
      // Memory metrics
      const memUsage = process.memoryUsage();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      
      this.metrics.system.memory = {
        used: memUsage.heapUsed,
        free: freeMem,
        total: totalMem,
        percentage: Math.round((memUsage.heapUsed / totalMem) * 100)
      };

      // CPU metrics
      const cpus = os.cpus();
      const loadAvg = os.loadavg();
      
      this.metrics.system.cpu = {
        usage: this.calculateCPUUsage(cpus),
        loadAverage: loadAvg
      };

      // Disk metrics
      this.collectDiskMetrics();

    } catch (error) {
      logger.error('Failed to collect system metrics', {
        error: error.message
      });
    }
  }

  /**
   * Collect database metrics
   */
  collectDatabaseMetrics() {
    try {
      // This would collect actual database connection metrics
      // For now, we'll use mock data
      this.metrics.database.connections = {
        active: Math.floor(Math.random() * 10),
        idle: Math.floor(Math.random() * 5),
        total: Math.floor(Math.random() * 15)
      };

    } catch (error) {
      logger.error('Failed to collect database metrics', {
        error: error.message
      });
    }
  }

  /**
   * Collect tenant metrics
   */
  collectTenantMetrics() {
    try {
      // This would collect actual tenant metrics
      // For now, we'll use mock data
      this.metrics.tenants = {
        active: Math.floor(Math.random() * 100),
        byTier: {
          free: Math.floor(Math.random() * 50),
          standard: Math.floor(Math.random() * 30),
          premium: Math.floor(Math.random() * 15),
          enterprise: Math.floor(Math.random() * 5)
        },
        usage: {}
      };

    } catch (error) {
      logger.error('Failed to collect tenant metrics', {
        error: error.message
      });
    }
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(responseTime) {
    const perf = this.metrics.performance.responseTime;
    
    // Update min/max
    perf.min = Math.min(perf.min, responseTime);
    perf.max = Math.max(perf.max, responseTime);
    
    // Update average
    const totalRequests = this.metrics.requests.total;
    perf.avg = (perf.avg * (totalRequests - 1) + responseTime) / totalRequests;
    
    // Update percentiles (simplified calculation)
    this.updatePercentiles(responseTime);
    
    // Update throughput (requests per second)
    const uptime = (Date.now() - this.startTime) / 1000;
    this.metrics.performance.throughput = totalRequests / uptime;
  }

  /**
   * Update error rate
   */
  updateErrorRate() {
    const totalRequests = this.metrics.requests.total;
    const failedRequests = this.metrics.requests.failed;
    
    if (totalRequests > 0) {
      this.metrics.performance.errorRate = (failedRequests / totalRequests) * 100;
    }
  }

  /**
   * Update percentiles
   */
  updatePercentiles(responseTime) {
    // This is a simplified implementation
    // In production, you'd use a proper percentile calculation library
    const perf = this.metrics.performance.responseTime;
    
    // Simple percentile approximation
    if (responseTime <= perf.avg) {
      perf.p50 = responseTime;
    }
    if (responseTime <= perf.avg * 1.5) {
      perf.p95 = responseTime;
    }
    if (responseTime <= perf.avg * 2) {
      perf.p99 = responseTime;
    }
  }

  /**
   * Calculate CPU usage
   */
  calculateCPUUsage(cpus) {
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    return 100 - Math.round(100 * totalIdle / totalTick);
  }

  /**
   * Collect disk metrics
   */
  collectDiskMetrics() {
    try {
      // This would collect actual disk usage
      // For now, we'll use mock data
      this.metrics.system.disk = {
        used: Math.floor(Math.random() * 100000000000), // 100GB
        free: Math.floor(Math.random() * 50000000000),  // 50GB
        total: 150000000000, // 150GB
        percentage: Math.floor(Math.random() * 100)
      };
    } catch (error) {
      logger.error('Failed to collect disk metrics', {
        error: error.message
      });
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.startTime,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    const metrics = this.getMetrics();
    const config = productionConfig.getConfig();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: metrics.uptime,
      version: config.app.version,
      environment: config.app.environment,
      checks: {
        memory: this.checkMemoryHealth(metrics.system.memory),
        cpu: this.checkCPUHealth(metrics.system.cpu),
        database: this.checkDatabaseHealth(metrics.database),
        errorRate: this.checkErrorRateHealth(metrics.performance.errorRate)
      }
    };

    // Determine overall health status
    const checks = Object.values(health.checks);
    if (checks.some(check => check.status === 'critical')) {
      health.status = 'critical';
    } else if (checks.some(check => check.status === 'warning')) {
      health.status = 'warning';
    }

    return health;
  }

  /**
   * Check memory health
   */
  checkMemoryHealth(memory) {
    const usage = memory.percentage;
    
    if (usage > 90) {
      return { status: 'critical', message: 'Memory usage critical', usage };
    } else if (usage > 80) {
      return { status: 'warning', message: 'Memory usage high', usage };
    } else {
      return { status: 'healthy', message: 'Memory usage normal', usage };
    }
  }

  /**
   * Check CPU health
   */
  checkCPUHealth(cpu) {
    const usage = cpu.usage;
    
    if (usage > 90) {
      return { status: 'critical', message: 'CPU usage critical', usage };
    } else if (usage > 80) {
      return { status: 'warning', message: 'CPU usage high', usage };
    } else {
      return { status: 'healthy', message: 'CPU usage normal', usage };
    }
  }

  /**
   * Check database health
   */
  checkDatabaseHealth(database) {
    const activeConnections = database.connections.active;
    const totalConnections = database.connections.total;
    const connectionRatio = activeConnections / totalConnections;
    
    if (connectionRatio > 0.9) {
      return { status: 'critical', message: 'Database connections critical', ratio: connectionRatio };
    } else if (connectionRatio > 0.8) {
      return { status: 'warning', message: 'Database connections high', ratio: connectionRatio };
    } else {
      return { status: 'healthy', message: 'Database connections normal', ratio: connectionRatio };
    }
  }

  /**
   * Check error rate health
   */
  checkErrorRateHealth(errorRate) {
    if (errorRate > 10) {
      return { status: 'critical', message: 'Error rate critical', rate: errorRate };
    } else if (errorRate > 5) {
      return { status: 'warning', message: 'Error rate high', rate: errorRate };
    } else {
      return { status: 'healthy', message: 'Error rate normal', rate: errorRate };
    }
  }

  /**
   * Generate metrics report
   */
  generateReport() {
    const metrics = this.getMetrics();
    const health = this.getHealthStatus();
    
    return {
      summary: {
        status: health.status,
        uptime: metrics.uptime,
        requests: metrics.requests.total,
        errorRate: metrics.performance.errorRate,
        responseTime: metrics.performance.responseTime.avg
      },
      metrics,
      health,
      recommendations: this.generateRecommendations(metrics, health)
    };
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(metrics, health) {
    const recommendations = [];
    
    if (health.checks.memory.status === 'warning' || health.checks.memory.status === 'critical') {
      recommendations.push('Consider increasing memory allocation or optimizing memory usage');
    }
    
    if (health.checks.cpu.status === 'warning' || health.checks.cpu.status === 'critical') {
      recommendations.push('Consider scaling horizontally or optimizing CPU-intensive operations');
    }
    
    if (health.checks.database.status === 'warning' || health.checks.database.status === 'critical') {
      recommendations.push('Consider database connection pooling or query optimization');
    }
    
    if (health.checks.errorRate.status === 'warning' || health.checks.errorRate.status === 'critical') {
      recommendations.push('Investigate and fix error sources to improve system reliability');
    }
    
    return recommendations;
  }
}

// Create singleton instance
const monitoring = new ProductionMonitoring();

module.exports = monitoring;
