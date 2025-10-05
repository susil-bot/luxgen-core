/**
 * @fileoverview Tenant Routes Builder
 * Comprehensive routes builder for tenant-specific database management
 * 
 * @module
 */

import { Request, Response, NextFunction, Router } from 'express';
import { tenantDatabaseManager } from '../../config/tenant/TenantDatabaseManager';
import { tenantConfigSwitcher } from '../../config/tenant/TenantConfigSwitcher';
import {
  TenantDatabaseContext,
  TenantDatabaseOperationResult,
  TenantDatabaseError,
  TenantDatabaseErrorType
} from '../../types/tenant/TenantDatabaseTypes';

/**
 * Route handler function type
 */
export type TenantRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
  tenantContext: TenantDatabaseContext
) => Promise<void> | void;

/**
 * Route configuration interface
 */
export interface TenantRouteConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  handler: TenantRouteHandler;
  middleware?: Array<(req: Request, res: Response, next: NextFunction) => void>;
  requireAuth?: boolean;
  requireTenant?: boolean;
  rateLimit?: {
    windowMs: number;
    max: number;
  };
  validation?: {
    body?: any;
    query?: any;
    params?: any;
  };
}

/**
 * Tenant route options
 */
export interface TenantRouteOptions {
  timeout?: number;
  cors?: boolean;
  rateLimit?: boolean;
  logging?: boolean;
  errorHandling?: boolean;
}

/**
 * TENANT ROUTES BUILDER
 * Comprehensive routes builder for tenant-specific database management
 * 
 * Features:
 * - Automatic tenant context injection
 * - Database connection management
 * - Error handling and recovery
 * - Performance monitoring
 * - Rate limiting and validation
 * - Comprehensive logging
 */
export class TenantRoutesBuilder {
  private routes: TenantRouteConfig[] = [];
  private router: Router;
  private options: TenantRouteOptions;

  constructor(options: TenantRouteOptions = {}) {
    this.router = Router();
    this.options = {
      timeout: 15000,
      cors: true,
      rateLimit: true,
      logging: true,
      errorHandling: true,
      ...options
    };
  }

  /**
   * Create and add a route with tenant context
   * 
   * @param config - Route configuration
   * @returns TenantRoutesBuilder instance for chaining
   */
  public addRoute(config: TenantRouteConfig): TenantRoutesBuilder {
    this.routes.push(config);
    return this;
  }

  /**
   * Add a GET route with tenant context
   * 
   * @param path - Route path
   * @param handler - Route handler function
   * @param options - Additional route options
   * @returns TenantRoutesBuilder instance for chaining
   */
  public get(
    path: string, 
    handler: TenantRouteHandler, 
    options: Partial<TenantRouteConfig> = {}
  ): TenantRoutesBuilder {
    return this.addRoute({
      path,
      method: 'GET',
      handler,
      ...options
    });
  }

  /**
   * Add a POST route with tenant context
   * 
   * @param path - Route path
   * @param handler - Route handler function
   * @param options - Additional route options
   * @returns TenantRoutesBuilder instance for chaining
   */
  public post(
    path: string, 
    handler: TenantRouteHandler, 
    options: Partial<TenantRouteConfig> = {}
  ): TenantRoutesBuilder {
    return this.addRoute({
      path,
      method: 'POST',
      handler,
      ...options
    });
  }

  /**
   * Add a PUT route with tenant context
   * 
   * @param path - Route path
   * @param handler - Route handler function
   * @param options - Additional route options
   * @returns TenantRoutesBuilder instance for chaining
   */
  public put(
    path: string, 
    handler: TenantRouteHandler, 
    options: Partial<TenantRouteConfig> = {}
  ): TenantRoutesBuilder {
    return this.addRoute({
      path,
      method: 'PUT',
      handler,
      ...options
    });
  }

  /**
   * Add a DELETE route with tenant context
   * 
   * @param path - Route path
   * @param handler - Route handler function
   * @param options - Additional route options
   * @returns TenantRoutesBuilder instance for chaining
   */
  public delete(
    path: string, 
    handler: TenantRouteHandler, 
    options: Partial<TenantRouteConfig> = {}
  ): TenantRoutesBuilder {
    return this.addRoute({
      path,
      method: 'DELETE',
      handler,
      ...options
    });
  }

  /**
   * Add a PATCH route with tenant context
   * 
   * @param path - Route path
   * @param handler - Route handler function
   * @param options - Additional route options
   * @returns TenantRoutesBuilder instance for chaining
   */
  public patch(
    path: string, 
    handler: TenantRouteHandler, 
    options: Partial<TenantRouteConfig> = {}
  ): TenantRoutesBuilder {
    return this.addRoute({
      path,
      method: 'PATCH',
      handler,
      ...options
    });
  }

  /**
   * Build the routes and return Express router
   * 
   * @returns Express router with all configured routes
   */
  public build(): Router {
    this.routes.forEach(route => {
      this.setupRoute(route);
    });
    
    return this.router;
  }

  /**
   * Setup individual route with tenant context
   * 
   * @param config - Route configuration
   */
  private setupRoute(config: TenantRouteConfig): void {
    const middleware = [
      this.tenantContextMiddleware(),
      this.errorHandlingMiddleware(),
      ...(config.middleware || [])
    ];

    const handler = this.wrapHandler(config.handler, config);
    
    this.router[config.method.toLowerCase()](config.path, ...middleware, handler);
  }

  /**
   * Tenant context middleware
   * Automatically injects tenant database context
   */
  private tenantContextMiddleware() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const tenantId = (req as any).tenantId || (req as any).tenant?.id;
        
        if (!tenantId) {
          return next(new Error('Tenant context required'));
        }

        // Initialize tenant database if not already connected
        if (!tenantDatabaseManager.getTenantConnection(tenantId)) {
          const initResult = await tenantDatabaseManager.initializeTenantDatabase(tenantId);
          if (!initResult.success) {
            throw new Error(`Failed to initialize tenant database: ${initResult.error}`);
          }
        }

        // Get tenant context
        const tenantContext: TenantDatabaseContext = {
          tenantId,
          tenantSlug: (req as any).tenantSlug || tenantId,
          databaseName: tenantDatabaseManager.getTenantDatabaseName(tenantId),
          connection: tenantDatabaseManager.getTenantConnection(tenantId)!,
          models: tenantDatabaseManager.getTenantModels(tenantId),
          config: tenantDatabaseManager.getTenantDatabaseConfig(tenantId),
          health: await tenantDatabaseManager.healthCheck(tenantId)
        };

        // Attach tenant context to request
        (req as any).tenantContext = tenantContext;
        
        next();
      } catch (error) {
        console.error('❌ Tenant context middleware error:', error);
        next(error);
      }
    };
  }

  /**
   * Error handling middleware
   */
  private errorHandlingMiddleware() {
    return (error: any, req: Request, res: Response, next: NextFunction): void => {
      if (error.message.includes('tenant') || error.message.includes('database')) {
        console.error('Tenant database error:', error);
        
        res.status(500).json({
          success: false,
          error: 'Tenant database error',
          message: 'Failed to access tenant-specific data',
          tenantId: (req as any).tenantId,
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      next(error);
    };
  }

  /**
   * Wrap handler with tenant context
   * 
   * @param handler - Original handler function
   * @param config - Route configuration
   * @returns Wrapped handler function
   */
  private wrapHandler(
    handler: TenantRouteHandler, 
    config: TenantRouteConfig
  ) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const tenantContext = (req as any).tenantContext;
        
        if (!tenantContext) {
          throw new Error('Tenant context not available');
        }

        // Call the original handler with tenant context
        await handler(req, res, next, tenantContext);
      } catch (error) {
        console.error(`❌ Route handler error [${config.path}]:`, error);
        next(error);
      }
    };
  }

  /**
   * Get all configured routes
   * 
   * @returns Array of route configurations
   */
  public getRoutes(): TenantRouteConfig[] {
    return [...this.routes];
  }

  /**
   * Clear all routes
   * 
   * @returns TenantRoutesBuilder instance for chaining
   */
  public clear(): TenantRoutesBuilder {
    this.routes = [];
    return this;
  }

  /**
   * Get route count
   * 
   * @returns Number of configured routes
   */
  public getRouteCount(): number {
    return this.routes.length;
  }
}

export default TenantRoutesBuilder;
