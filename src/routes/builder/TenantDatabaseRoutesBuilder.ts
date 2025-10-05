/**
 * @fileoverview Tenant Database Routes Builder
 * Specialized routes builder for tenant database management operations
 * 
 * @module
 */

import { Request, Response, NextFunction } from 'express';
import { TenantRoutesBuilder, TenantRouteHandler } from './TenantRoutesBuilder';
import { tenantDatabaseManager } from '../../config/tenant/TenantDatabaseManager';
import { tenantConfigSwitcher } from '../../config/tenant/TenantConfigSwitcher';
import { TenantDatabaseContext } from '../../types/tenant/TenantDatabaseTypes';

/**
 * TENANT DATABASE ROUTES BUILDER
 * Specialized routes builder for tenant database management operations
 * 
 * Features:
 * - Pre-configured tenant database routes
 * - Automatic tenant context injection
 * - Database health monitoring
 * - Statistics and analytics
 * - Error handling and recovery
 */
export class TenantDatabaseRoutesBuilder extends TenantRoutesBuilder {
  constructor() {
    super({
      timeout: 30000,
      cors: true,
      rateLimit: true,
      logging: true,
      errorHandling: true
    });

    this.setupDefaultRoutes();
  }

  /**
   * Setup default tenant database routes
   */
  private setupDefaultRoutes(): void {
    // Health check routes
    this.get('/health', this.healthCheckHandler)
      .get('/health/:tenantId', this.tenantHealthCheckHandler);

    // Statistics routes
    this.get('/stats', this.statsHandler)
      .get('/stats/:tenantId', this.tenantStatsHandler);

    // Database management routes
    this.post('/initialize/:tenantId', this.initializeTenantHandler)
      .delete('/close/:tenantId', this.closeTenantHandler)
      .delete('/drop/:tenantId', this.dropTenantHandler);

    // Configuration routes
    this.get('/config/:tenantId', this.tenantConfigHandler)
      .get('/limits/:tenantId', this.tenantLimitsHandler)
      .get('/tenants', this.allTenantsHandler);

    // Cleanup routes
    this.delete('/cleanup/:tenantId', this.cleanupTenantHandler)
      .delete('/cleanup', this.cleanupAllHandler);
  }

  /**
   * Health check handler
   */
  private healthCheckHandler: TenantRouteHandler = async (req, res, next, tenantContext) => {
    try {
      const activeConnections = tenantDatabaseManager.getActiveConnections();
      const healthChecks = [];

      for (const connection of activeConnections) {
        const health = await tenantDatabaseManager.healthCheck(connection.tenantId);
        healthChecks.push({
          tenantId: connection.tenantId,
          databaseName: connection.databaseName,
          ...health
        });
      }

      res.json({
        success: true,
        healthChecks,
        totalConnections: activeConnections.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Health check failed:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  };

  /**
   * Tenant-specific health check handler
   */
  private tenantHealthCheckHandler: TenantRouteHandler = async (req, res, next, tenantContext) => {
    try {
      const { tenantId } = req.params;
      const health = await tenantDatabaseManager.healthCheck(tenantId);

      res.json({
        success: true,
        health,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`❌ Tenant health check failed for ${req.params.tenantId}:`, error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  };

  /**
   * Statistics handler
   */
  private statsHandler: TenantRouteHandler = async (req, res, next, tenantContext) => {
    try {
      const statistics = await tenantConfigSwitcher.getTenantStatistics();

      res.json({
        success: true,
        statistics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Failed to get statistics:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  };

  /**
   * Tenant-specific statistics handler
   */
  private tenantStatsHandler: TenantRouteHandler = async (req, res, next, tenantContext) => {
    try {
      const { tenantId } = req.params;
      const stats = await tenantDatabaseManager.getTenantDatabaseStats(tenantId);

      res.json({
        success: true,
        stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`❌ Failed to get stats for tenant ${req.params.tenantId}:`, error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  };

  /**
   * Initialize tenant handler
   */
  private initializeTenantHandler: TenantRouteHandler = async (req, res, next, tenantContext) => {
    try {
      const { tenantId } = req.params;
      const result = await tenantDatabaseManager.initializeTenantDatabase(tenantId);

      if (result.success) {
        res.json({
          success: true,
          message: `Tenant database initialized for ${tenantId}`,
          databaseName: tenantDatabaseManager.getTenantDatabaseName(tenantId),
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error(`❌ Failed to initialize tenant ${req.params.tenantId}:`, error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  };

  /**
   * Close tenant handler
   */
  private closeTenantHandler: TenantRouteHandler = async (req, res, next, tenantContext) => {
    try {
      const { tenantId } = req.params;
      const result = await tenantDatabaseManager.closeTenantConnection(tenantId);

      res.json({
        success: true,
        message: `Tenant database connection closed for ${tenantId}`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`❌ Failed to close tenant ${req.params.tenantId}:`, error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  };

  /**
   * Drop tenant handler
   */
  private dropTenantHandler: TenantRouteHandler = async (req, res, next, tenantContext) => {
    try {
      const { tenantId } = req.params;
      const result = await tenantDatabaseManager.dropTenantDatabase(tenantId);

      res.json({
        success: true,
        message: `Tenant database dropped for ${tenantId}`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`❌ Failed to drop tenant ${req.params.tenantId}:`, error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  };

  /**
   * Tenant configuration handler
   */
  private tenantConfigHandler: TenantRouteHandler = async (req, res, next, tenantContext) => {
    try {
      const { tenantId } = req.params;
      const config = tenantConfigSwitcher.getTenantConfig(tenantId);

      if (!config) {
        res.status(404).json({
          success: false,
          error: 'Tenant configuration not found'
        });
        return;
      }

      res.json({
        success: true,
        config,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`❌ Failed to get tenant config for ${req.params.tenantId}:`, error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  };

  /**
   * Tenant limits handler
   */
  private tenantLimitsHandler: TenantRouteHandler = async (req, res, next, tenantContext) => {
    try {
      const { tenantId } = req.params;
      const limits = await tenantConfigSwitcher.checkTenantLimits(tenantId);

      res.json({
        success: true,
        limits,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`❌ Failed to check tenant limits for ${req.params.tenantId}:`, error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  };

  /**
   * All tenants handler
   */
  private allTenantsHandler: TenantRouteHandler = async (req, res, next, tenantContext) => {
    try {
      const tenants = tenantConfigSwitcher.getAllTenants();

      res.json({
        success: true,
        tenants,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Failed to get all tenants:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  };

  /**
   * Cleanup tenant handler
   */
  private cleanupTenantHandler: TenantRouteHandler = async (req, res, next, tenantContext) => {
    try {
      const { tenantId } = req.params;
      const result = await tenantConfigSwitcher.cleanupTenant(tenantId);

      res.json({
        success: true,
        message: `Tenant resources cleaned up for ${tenantId}`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`❌ Failed to cleanup tenant ${req.params.tenantId}:`, error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  };

  /**
   * Cleanup all handler
   */
  private cleanupAllHandler: TenantRouteHandler = async (req, res, next, tenantContext) => {
    try {
      const result = await tenantConfigSwitcher.cleanupAll();

      res.json({
        success: true,
        message: 'All tenant resources cleaned up',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Failed to cleanup all tenants:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  };
}

export default TenantDatabaseRoutesBuilder;
