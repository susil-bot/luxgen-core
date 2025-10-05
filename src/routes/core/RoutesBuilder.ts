/**
 * @fileoverview Routes Builder
 * Comprehensive routes builder for tenant-specific operations with workflow support
 * 
 * @module
 */

import { Request, Response, NextFunction, Router } from 'express';
import { tenantDatabaseManager } from '../../config/tenant/TenantDatabaseManager';
import { tenantConfigSwitcher } from '../../config/tenant/TenantConfigSwitcher';
import { TenantDatabaseContext } from '../../types/tenant/TenantDatabaseTypes';

/**
 * Route configuration interface
 */
export interface RouteConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler: any;
  options?: {
    timeout?: number;
    cors?: boolean;
    rateLimit?: boolean;
    validation?: any;
    middleware?: Array<(req: Request, res: Response, next: NextFunction) => void>;
  };
}

/**
 * Workflow function type
 */
export type WorkflowFn = (
  tenantContext: TenantDatabaseContext,
  requestData: any
) => Promise<any> | any;

/**
 * Universal handler function type
 */
export type UniversalHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

/**
 * ROUTES BUILDER
 * Comprehensive routes builder for tenant-specific operations
 * 
 * Features:
 * - Workflow-based request handling
 * - Automatic tenant context injection
 * - Route configuration management
 * - Error handling and recovery
 * - Performance monitoring
 */
export class RoutesBuilder {
  private routes: RouteConfig[] = [];
  private router: Router;
  private options: {
    timeout: number;
    cors: boolean;
    rateLimit: boolean;
    logging: boolean;
    errorHandling: boolean;
  };

  constructor(options: {
    timeout?: number;
    cors?: boolean;
    rateLimit?: boolean;
    logging?: boolean;
    errorHandling?: boolean;
  } = {}) {
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
   * Add a route with configuration
   * 
   * @param config - Route configuration
   * @returns RoutesBuilder instance for chaining
   */
  public route(config: RouteConfig): RoutesBuilder {
    config.options = {
      timeout: this.options.timeout,
      cors: this.options.cors,
      rateLimit: this.options.rateLimit,
      ...config.options
    };
    
    this.routes.push(config);
    return this;
  }

  /**
   * Add a route with workflow
   * 
   * @param path - Route path
   * @param workflowFn - Workflow function
   * @param method - HTTP method
   * @param options - Additional options
   * @returns RoutesBuilder instance for chaining
   */
  public addRouteWithWorkflow(
    path: string,
    workflowFn: WorkflowFn,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
    options: Partial<RouteConfig['options']> = {}
  ): RoutesBuilder {
    return this.route({
      method,
      path,
      handler: this.provideUniversalHandler(workflowFn),
      options: {
        timeout: this.options.timeout,
        cors: this.options.cors,
        rateLimit: this.options.rateLimit,
        ...options
      }
    });
  }

  /**
   * Provide universal handler for workflow
   * 
   * @param workflowFn - Workflow function
   * @returns Universal handler function
   */
  public provideUniversalHandler(workflowFn: WorkflowFn): UniversalHandler {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Get tenant context from request
        const tenantContext = (req as any).tenantContext;
        
        if (!tenantContext) {
          // Try to initialize tenant context if not available
          const tenantId = (req as any).tenantId || (req as any).tenant?.id;
          
          if (!tenantId) {
            return res.status(400).json({
              success: false,
              error: 'Tenant context required'
            });
          }

          // Initialize tenant database if not already connected
          if (!tenantDatabaseManager.getTenantConnection(tenantId)) {
            const initResult = await tenantDatabaseManager.initializeTenantDatabase(tenantId);
            if (!initResult.success) {
              throw new Error(`Failed to initialize tenant database: ${initResult.error}`);
            }
          }

          // Create tenant context
          const newTenantContext: TenantDatabaseContext = {
            tenantId,
            tenantSlug: (req as any).tenantSlug || tenantId,
            databaseName: tenantDatabaseManager.getTenantDatabaseName(tenantId),
            connection: tenantDatabaseManager.getTenantConnection(tenantId)!,
            models: tenantDatabaseManager.getTenantModels(tenantId),
            config: tenantDatabaseManager.getTenantDatabaseConfig(tenantId),
            health: await tenantDatabaseManager.healthCheck(tenantId)
          };

          (req as any).tenantContext = newTenantContext;
        }

        // Prepare request data
        const requestData = {
          method: req.method,
          path: req.path,
          params: req.params,
          query: req.query,
          body: req.body,
          headers: req.headers,
          user: (req as any).user,
          tenantContext: (req as any).tenantContext
        };

        // Execute workflow
        const result = await workflowFn((req as any).tenantContext, requestData);
        
        if (result && typeof result === 'object') {
          if (result.success === false) {
            return res.status(result.statusCode || 400).json({
              success: false,
              error: result.error,
              timestamp: new Date().toISOString()
            });
          }
          
          if (result.statusCode) {
            res.status(result.statusCode);
          }
          
          if (result.headers) {
            Object.entries(result.headers).forEach(([key, value]) => {
              res.set(key, value as string);
            });
          }
          
          res.json({
            success: true,
            data: result.data,
            timestamp: new Date().toISOString()
          });
        } else {
          res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('❌ Universal handler error:', error);
        res.status(500).json({
          success: false,
          error: (error as Error).message,
          timestamp: new Date().toISOString()
        });
      }
    };
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
   * Setup individual route
   * 
   * @param config - Route configuration
   */
  private setupRoute(config: RouteConfig): void {
    const middleware = [
      this.tenantContextMiddleware(),
      this.errorHandlingMiddleware(),
      ...(config.options?.middleware || [])
    ];

    this.router[config.method.toLowerCase()](config.path, ...middleware, config.handler);
  }

  /**
   * Tenant context middleware
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
   * Get all configured routes
   * 
   * @returns Array of route configurations
   */
  public getRoutes(): RouteConfig[] {
    return [...this.routes];
  }

  /**
   * Clear all routes
   * 
   * @returns RoutesBuilder instance for chaining
   */
  public clear(): RoutesBuilder {
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

export default RoutesBuilder;
