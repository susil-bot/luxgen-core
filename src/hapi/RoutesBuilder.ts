/**
 * @fileoverview Routes Builder
 * Routes builder following the Hapi.js architecture pattern
 * 
 * @module
 */

import { ServerRoute, Request, ResponseToolkit } from '@hapi/hapi';
import { tenantDatabaseManager } from '../config/tenant/TenantDatabaseManager';
import { tenantConfigSwitcher } from '../config/tenant/TenantConfigSwitcher';
import { TenantDatabaseContext } from '../types/tenant/TenantDatabaseTypes';
import { PageWorkflow, PluginWorkflow, ProxyWorkflow, CollectionWorkflowMediator, MetaWorkflow } from './Workflow';

/**
 * Workflow function type
 */
export type WorkflowFn = (
  tenantContext: TenantDatabaseContext,
  request: Request,
  h: ResponseToolkit
) => Promise<any> | any;

/**
 * Universal handler function type
 */
export type UniversalHandler = (
  request: Request,
  h: ResponseToolkit
) => Promise<any> | any;

/**
 * ROUTES BUILDER
 * Routes builder following the Hapi.js architecture pattern
 * 
 * Features:
 * - Workflow-based request handling
 * - Automatic tenant context injection
 * - Route configuration management
 * - Error handling and recovery
 * - Performance monitoring
 */
export class RoutesBuilder {
  private routes: ServerRoute[] = [];
  private options: any;

  constructor(options: any = {}) {
    this.options = {
      timeout: {
        server: process.env.HAPI_SERVER_TIMEOUT || 15000 // milliseconds
      },
      ...options
    };
  }

  /**
   * Add a route with configuration
   * 
   * @param route - Route configuration
   * @returns RoutesBuilder instance for chaining
   */
  public route(route: ServerRoute): RoutesBuilder {
    route.options = this.options;
    this.routes.push(route);
    return this;
  }

  /**
   * Add a route with workflow
   * 
   * @param path - Route path
   * @param workflowFn - Workflow function
   * @param method - HTTP method
   * @returns RoutesBuilder instance for chaining
   */
  public addRouteWithWorkflow(
    path: string,
    workflowFn: WorkflowFn,
    method: string = 'GET'
  ): RoutesBuilder {
    this.routes.push({
      method,
      path: `/{tenantSlug}${path}`,
      handler: this.provideUniversalHandler(workflowFn),
      options: this.options
    });

    return this;
  }

  /**
   * Provide universal handler for workflow
   * 
   * @param workflowFn - Workflow function
   * @returns Universal handler function
   */
  public provideUniversalHandler(workflowFn: WorkflowFn): UniversalHandler {
    return async (request: Request, h: ResponseToolkit): Promise<any> => {
      try {
        // Get tenant from request
        const tenantSlug = request.params.tenantSlug;
        
        if (!tenantSlug) {
          return h.response({
            success: false,
            error: 'Tenant slug required'
          }).code(400);
        }

        // Initialize tenant context
        const tenantContext = await this.initializeTenantContext(tenantSlug, request);
        
        if (!tenantContext) {
          return h.response({
            success: false,
            error: 'Failed to initialize tenant context'
          }).code(500);
        }

        // Execute workflow
        const result = await workflowFn(tenantContext, request, h);
        
        if (result && typeof result === 'object') {
          if (result.success === false) {
            return h.response({
              success: false,
              error: result.error
            }).code(result.statusCode || 400);
          }
          
          if (result.statusCode) {
            return h.response(result.data).code(result.statusCode);
          }
          
          return h.response(result.data);
        } else {
          return h.response(result);
        }
      } catch (error) {
        console.error('❌ Universal handler error:', error);
        return h.response({
          success: false,
          error: (error as Error).message
        }).code(500);
      }
    };
  }

  /**
   * Initialize tenant context
   * 
   * @param tenantSlug - Tenant slug
   * @param request - Hapi request
   * @returns Promise resolving to tenant context
   */
  private async initializeTenantContext(tenantSlug: string, request: Request): Promise<TenantDatabaseContext | null> {
    try {
      // Get tenant configuration
      const tenantConfig = tenantConfigSwitcher.getTenantConfig(tenantSlug);
      
      if (!tenantConfig) {
        throw new Error(`Tenant configuration not found: ${tenantSlug}`);
      }

      // Initialize tenant database if not already connected
      if (!tenantDatabaseManager.getTenantConnection(tenantConfig.id)) {
        const initResult = await tenantDatabaseManager.initializeTenantDatabase(tenantConfig.id);
        if (!initResult.success) {
          throw new Error(`Failed to initialize tenant database: ${initResult.error}`);
        }
      }

      // Create tenant context
      const tenantContext: TenantDatabaseContext = {
        tenantId: tenantConfig.id,
        tenantSlug: tenantConfig.slug,
        databaseName: tenantDatabaseManager.getTenantDatabaseName(tenantConfig.id),
        connection: tenantDatabaseManager.getTenantConnection(tenantConfig.id)!,
        models: tenantDatabaseManager.getTenantModels(tenantConfig.id),
        config: tenantDatabaseManager.getTenantDatabaseConfig(tenantConfig.id),
        health: await tenantDatabaseManager.healthCheck(tenantConfig.id)
      };

      return tenantContext;
    } catch (error) {
      console.error(`❌ Failed to initialize tenant context for ${tenantSlug}:`, error);
      return null;
    }
  }

  /**
   * Build the routes
   * 
   * @returns Array of server routes
   */
  public build(): ServerRoute[] {
    return [...this.routes];
  }

  /**
   * Get all configured routes
   * 
   * @returns Array of route configurations
   */
  public getRoutes(): ServerRoute[] {
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
