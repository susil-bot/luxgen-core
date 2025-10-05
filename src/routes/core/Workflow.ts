/**
 * @fileoverview Workflow Base Classes
 * Base workflow classes for tenant-specific operations
 * 
 * @module
 */

import { Request, Response } from 'express';
import { TenantDatabaseContext } from '../../types/tenant/TenantDatabaseTypes';

/**
 * Workflow result interface
 */
export interface WorkflowResult {
  success: boolean;
  data?: any;
  error?: string;
  statusCode: number;
  headers?: Record<string, string>;
}

/**
 * Base workflow class
 */
export abstract class BaseWorkflow {
  protected tenantContext: TenantDatabaseContext;
  protected requestData: any;

  constructor(tenantContext: TenantDatabaseContext, requestData: any) {
    this.tenantContext = tenantContext;
    this.requestData = requestData;
  }

  /**
   * Execute the workflow
   * 
   * @returns Promise resolving to workflow result
   */
  abstract run(): Promise<WorkflowResult>;
}

/**
 * Page workflow for rendering pages
 */
export class PageWorkflow extends BaseWorkflow {
  private plugin: any;
  private channel: string;

  constructor(plugin: any, tenantContext: TenantDatabaseContext, channel: string = 'default') {
    super(tenantContext, {});
    this.plugin = plugin;
    this.channel = channel;
  }

  async run(): Promise<WorkflowResult> {
    try {
      const result = await this.plugin(this.tenantContext, this.requestData);
      
      return {
        success: true,
        data: result,
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        statusCode: 500
      };
    }
  }
}

/**
 * Plugin workflow for executing plugins
 */
export class PluginWorkflow extends BaseWorkflow {
  private plugin: any;
  private channel: string;

  constructor(plugin: any, tenantContext: TenantDatabaseContext, channel: string = 'default') {
    super(tenantContext, {});
    this.plugin = plugin;
    this.channel = channel;
  }

  async run(): Promise<WorkflowResult> {
    try {
      const result = await this.plugin(this.tenantContext, this.requestData);
      
      return {
        success: true,
        data: result,
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        statusCode: 500
      };
    }
  }
}

/**
 * Proxy workflow for proxying requests
 */
export class ProxyWorkflow extends BaseWorkflow {
  private plugin: any;
  private channel: string;

  constructor(plugin: any, tenantContext: TenantDatabaseContext, channel: string = 'default') {
    super(tenantContext, {});
    this.plugin = plugin;
    this.channel = channel;
  }

  async run(): Promise<WorkflowResult> {
    try {
      const result = await this.plugin(this.tenantContext, this.requestData);
      
      return {
        success: true,
        data: result,
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        statusCode: 500
      };
    }
  }
}

/**
 * Collection workflow mediator for handling collections
 */
export class CollectionWorkflowMediator extends BaseWorkflow {
  private plugin: any;
  private channel: string;

  constructor(plugin: any, tenantContext: TenantDatabaseContext, channel: string = 'default') {
    super(tenantContext, {});
    this.plugin = plugin;
    this.channel = channel;
  }

  async run(): Promise<WorkflowResult> {
    try {
      const result = await this.plugin(this.tenantContext, this.requestData);
      
      return {
        success: true,
        data: result,
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        statusCode: 500
      };
    }
  }
}

/**
 * Meta workflow for handling meta operations
 */
export class MetaWorkflow extends BaseWorkflow {
  private plugin: any;
  private channel: string;

  constructor(plugin: any, tenantContext: TenantDatabaseContext, channel: string = 'default') {
    super(tenantContext, {});
    this.plugin = plugin;
    this.channel = channel;
  }

  async run(): Promise<WorkflowResult> {
    try {
      const result = await this.plugin(this.tenantContext, this.requestData);
      
      return {
        success: true,
        data: result,
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        statusCode: 500
      };
    }
  }
}

export default BaseWorkflow;
