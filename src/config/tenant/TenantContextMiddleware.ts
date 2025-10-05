/**
 * @fileoverview Tenant Context Middleware
 * Automatic tenant context switching and database selection with comprehensive error handling
 * 
 * @module
 */

import { Request, Response, NextFunction } from 'express';
import { tenantDatabaseManager } from './TenantDatabaseManager';
import {
  TenantDatabaseContext,
  TenantDatabaseHealth,
  TenantDatabaseOperationResult,
  TenantDatabaseError,
  TenantDatabaseErrorType,
  TenantDatabaseEventType,
  TenantDatabaseEventHandler
} from '../../types/tenant/TenantDatabaseTypes';

/**
 * TENANT CONTEXT MIDDLEWARE
 * Comprehensive tenant context management with automatic database switching
 * 
 * Features:
 * - Automatic tenant database switching
 * - Health monitoring and recovery
 * - Error handling and fallback
 * - Performance monitoring
 * - Event-driven architecture
 */
export class TenantContextMiddleware {
  private static instance: TenantContextMiddleware;
  private eventHandlers: Map<TenantDatabaseEventType, TenantDatabaseEventHandler[]> = new Map();

  private constructor() {
    this.setupEventHandlers();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): TenantContextMiddleware {
    if (!TenantContextMiddleware.instance) {
      TenantContextMiddleware.instance = new TenantContextMiddleware();
    }
    return TenantContextMiddleware.instance;
  }

  /**
   * Middleware to automatically switch to tenant-specific database
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  static async switchToTenantDatabase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get tenant from request (set by tenant identification middleware)
      const tenantId = (req as any).tenantId || (req as any).tenant?.id;
      
      if (!tenantId) {
        return next(new Error('Tenant context required for database access'));
      }

      // Initialize tenant database if not already connected
      if (!tenantDatabaseManager.getTenantConnection(tenantId)) {
        const initResult = await tenantDatabaseManager.initializeTenantDatabase(tenantId);
        if (!initResult.success) {
          throw new Error(`Failed to initialize tenant database: ${initResult.error}`);
        }
      }

      // Get tenant-specific models
      const tenantModels = tenantDatabaseManager.getTenantModels(tenantId);
      const tenantConnection = tenantDatabaseManager.getTenantConnection(tenantId);
      
      if (!tenantConnection) {
        throw new Error(`No connection found for tenant: ${tenantId}`);
      }

      // Attach tenant models to request
      (req as any).tenantModels = tenantModels;
      (req as any).tenantConnection = tenantConnection;
      
      // Add tenant context to request
      (req as any).tenantContext = {
        tenantId,
        databaseName: tenantDatabaseManager.getTenantDatabaseName(tenantId),
        models: tenantModels,
        connection: tenantConnection
      };

      console.log(`🔄 Switched to tenant database: ${tenantId}`);
      next();
    } catch (error) {
      console.error('❌ Failed to switch to tenant database:', error);
      next(error);
    }
  }

  /**
   * Middleware to ensure tenant database is available
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  static async ensureTenantDatabase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || (req as any).tenant?.id;
      
      if (!tenantId) {
        return next(new Error('Tenant context required'));
      }

      // Check if tenant database is healthy
      const healthCheck = await tenantDatabaseManager.healthCheck(tenantId);
      
      if (!healthCheck.healthy) {
        // Try to reconnect
        const initResult = await tenantDatabaseManager.initializeTenantDatabase(tenantId);
        if (!initResult.success) {
          throw new Error(`Failed to reconnect to tenant database: ${initResult.error}`);
        }
      }

      next();
    } catch (error) {
      console.error('❌ Tenant database health check failed:', error);
      next(error);
    }
  }

  /**
   * Middleware to inject tenant context into all database operations
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  static injectTenantContext(req: Request, res: Response, next: NextFunction): void {
    const tenantId = (req as any).tenantId || (req as any).tenant?.id;
    
    if (!tenantId) {
      return next(new Error('Tenant context required'));
    }

    // Override common database operations to include tenant context
    const originalQuery = (req as any).query;
    (req as any).query = {
      ...originalQuery,
      tenantId: tenantId
    };

    // Add tenant filter to all database operations
    (req as any).tenantFilter = { tenantId: tenantId };
    
    next();
  }

  /**
   * Middleware to handle tenant database errors
   * 
   * @param error - Error object
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  static handleTenantDatabaseErrors(error: any, req: Request, res: Response, next: NextFunction): void {
    if (error.message.includes('tenant') || error.message.includes('database')) {
      console.error('Tenant database error:', error);
      
      return res.status(500).json({
        success: false,
        error: 'Tenant database error',
        message: 'Failed to access tenant-specific data',
        tenantId: (req as any).tenantId,
        timestamp: new Date().toISOString()
      });
    }
    
    next(error);
  }

  /**
   * Get tenant database statistics
   * 
   * @param req - Express request object
   * @param res - Express response object
   */
  static async getTenantStats(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = (req as any).tenantId || (req as any).tenant?.id;
      
      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Tenant context required'
        });
        return;
      }

      const stats = await tenantDatabaseManager.getTenantDatabaseStats(tenantId);
      
      res.json({
        success: true,
        stats: stats
      });
    } catch (error) {
      console.error('❌ Failed to get tenant stats:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  /**
   * List all tenant databases
   * 
   * @param req - Express request object
   * @param res - Express response object
   */
  static async listTenantDatabases(req: Request, res: Response): Promise<void> {
    try {
      const databases = await tenantDatabaseManager.listTenantDatabases();
      
      res.json({
        success: true,
        databases: databases
      });
    } catch (error) {
      console.error('❌ Failed to list tenant databases:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  /**
   * Health check for all tenant databases
   * 
   * @param req - Express request object
   * @param res - Express response object
   */
  static async healthCheckAll(req: Request, res: Response): Promise<void> {
    try {
      const activeConnections = tenantDatabaseManager.getActiveConnections();
      const healthChecks: TenantDatabaseHealth[] = [];
      
      for (const connection of activeConnections) {
        const health = await tenantDatabaseManager.healthCheck(connection.tenantId);
        healthChecks.push(health);
      }
      
      res.json({
        success: true,
        healthChecks: healthChecks,
        totalConnections: activeConnections.length
      });
    } catch (error) {
      console.error('❌ Failed to perform health checks:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Setup default event handlers for monitoring
    this.addEventHandler(TenantDatabaseEventType.ERROR, (event) => {
      console.error(`Tenant Database Error [${event.tenantId}]:`, event.error);
    });

    this.addEventHandler(TenantDatabaseEventType.CONNECTED, (event) => {
      console.log(`Tenant Database Connected [${event.tenantId}]:`, event.data);
    });

    this.addEventHandler(TenantDatabaseEventType.DISCONNECTED, (event) => {
      console.log(`Tenant Database Disconnected [${event.tenantId}]`);
    });
  }

  /**
   * Add event handler
   * 
   * @param eventType - Event type
   * @param handler - Event handler function
   */
  addEventHandler(eventType: TenantDatabaseEventType, handler: TenantDatabaseEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Remove event handler
   * 
   * @param eventType - Event type
   * @param handler - Event handler function
   */
  removeEventHandler(eventType: TenantDatabaseEventType, handler: TenantDatabaseEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.eventHandlers.clear();
  }
}

export default TenantContextMiddleware;
