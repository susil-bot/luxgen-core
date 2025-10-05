/**
 * LUXGEN WORKFLOW SYSTEM
 * Global workflow system for multi-tenancy data flow
 */

// Core interfaces
export { Workflow, WorkflowDefinition, WorkflowStep, WorkflowTrigger, WorkflowCondition, WorkflowErrorHandling, NotificationConfig, WorkflowStepHandler, WorkflowExecution, WorkflowStepResult, WorkflowError, BaseWorkflow } from './Workflow';

// Context and Result
export { WorkflowContext, TenantConfiguration, TenantLimits, TenantBranding, TenantSecurity, PasswordPolicy, DataRetentionPolicy, PerformanceMetrics, ErrorContext, AuditEntry, WorkflowStep, WorkflowDefinition, WorkflowTrigger, WorkflowCondition, WorkflowErrorHandling, NotificationConfig, createWorkflowContext, updateWorkflowContext, addAuditEntry, hasPermission, allowsCrossTenantAccess, validateWorkflowContext } from './WorkflowContext';

export { WorkflowResult, WorkflowError, WorkflowMetadata, WorkflowStepResult, PerformanceMetrics, AuditEntry, TenantContext, TenantLimits, TenantSecurity, createSuccessResult, createErrorResult, createWorkflowError, addStepResult, addAuditEntry, hasErrors, getAllErrors, getRetryableErrors, mergeWorkflowResults } from './WorkflowResult';

// Workflow Management
export { WorkflowManager, WorkflowStatistics, workflowManager } from './WorkflowManager';

// Tenant-specific workflows
export { TenantWorkflow } from './TenantWorkflow';

// Express middleware
export { workflowMiddleware, tenantWorkflowMiddleware, workflowResultHandler, workflowErrorHandler, WorkflowMiddlewareOptions } from './WorkflowMiddleware';

// Common types
export interface TenantId extends String {}
export interface UserId extends String {}

// Workflow factory
export class WorkflowFactory {
  /**
   * Create a tenant-specific workflow
   */
  static createTenantWorkflow(
    workflowId: string,
    tenantId: string,
    tenantSlug: string
  ): TenantWorkflow {
    const definition: WorkflowDefinition = {
      id: `${tenantId}_${workflowId}`,
      name: `Tenant Workflow: ${workflowId}`,
      version: '1.0.0',
      description: `Tenant-specific workflow for ${tenantSlug}`,
      steps: TenantWorkflow.createTenantSteps(tenantId),
      triggers: [],
      conditions: [],
      errorHandling: {
        strategy: 'retry',
        maxRetries: 3,
        retryDelay: 1000,
        notifications: []
      },
      tenantSpecific: true,
      crossTenantAllowed: false
    };

    return new TenantWorkflow(definition, tenantId, tenantSlug);
  }

  /**
   * Create a cross-tenant workflow
   */
  static createCrossTenantWorkflow(
    workflowId: string,
    allowedTenants: string[]
  ): BaseWorkflow {
    const definition: WorkflowDefinition = {
      id: `cross_tenant_${workflowId}`,
      name: `Cross-Tenant Workflow: ${workflowId}`,
      version: '1.0.0',
      description: `Cross-tenant workflow for ${workflowId}`,
      steps: [],
      triggers: [],
      conditions: [],
      errorHandling: {
        strategy: 'retry',
        maxRetries: 3,
        retryDelay: 1000,
        notifications: []
      },
      tenantSpecific: false,
      crossTenantAllowed: true
    };

    return new BaseWorkflow(definition);
  }
}

// Workflow registry
export class WorkflowRegistry {
  private static workflows: Map<string, Workflow> = new Map();

  /**
   * Register a workflow
   */
  static register(workflowId: string, workflow: Workflow): void {
    this.workflows.set(workflowId, workflow);
  }

  /**
   * Get a workflow
   */
  static get(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Get all workflows
   */
  static getAll(): Map<string, Workflow> {
    return new Map(this.workflows);
  }

  /**
   * Remove a workflow
   */
  static remove(workflowId: string): boolean {
    return this.workflows.delete(workflowId);
  }

  /**
   * Clear all workflows
   */
  static clear(): void {
    this.workflows.clear();
  }
}

// Workflow utilities
export class WorkflowUtils {
  /**
   * Validate workflow context
   */
  static validateContext(context: WorkflowContext): boolean {
    return validateWorkflowContext(context);
  }

  /**
   * Check permissions
   */
  static hasPermission(context: WorkflowContext, permission: string): boolean {
    return hasPermission(context, permission);
  }

  /**
   * Check cross-tenant access
   */
  static allowsCrossTenantAccess(context: WorkflowContext): boolean {
    return allowsCrossTenantAccess(context);
  }

  /**
   * Create workflow context
   */
  static createContext(
    request: any,
    response: any,
    tenantId: string,
    tenantSlug: string,
    tenantConfig: any,
    userId?: string,
    userRole?: string
  ): WorkflowContext {
    return createWorkflowContext(request, response, tenantId, tenantSlug, tenantConfig, userId, userRole);
  }
}

// Export default
export default {
  WorkflowFactory,
  WorkflowRegistry,
  WorkflowUtils,
  workflowManager
};
