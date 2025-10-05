/**
 * LUXGEN WORKFLOW MANAGER
 * Orchestrates and manages workflow execution for multi-tenancy
 */

import { Workflow, WorkflowDefinition, WorkflowExecution } from './Workflow';
import { WorkflowContext } from './WorkflowContext';
import { WorkflowResult } from './WorkflowResult';

export class WorkflowManager {
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private tenantWorkflows: Map<string, string[]> = new Map();

  /**
   * Register a workflow
   */
  registerWorkflow(workflow: Workflow, definition: WorkflowDefinition): void {
    this.workflows.set(definition.id, workflow);
    
    // Track tenant-specific workflows
    if (definition.tenantSpecific) {
      const tenantId = definition.id.split('_')[0]; // Extract tenant from workflow ID
      if (!this.tenantWorkflows.has(tenantId)) {
        this.tenantWorkflows.set(tenantId, []);
      }
      this.tenantWorkflows.get(tenantId)!.push(definition.id);
    }
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string,
    context: WorkflowContext
  ): Promise<WorkflowResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return {
        success: false,
        message: `Workflow not found: ${workflowId}`,
        statusCode: 404
      };
    }

    // Check tenant permissions
    if (!this.checkTenantPermissions(workflowId, context)) {
      return {
        success: false,
        message: 'Insufficient tenant permissions',
        statusCode: 403
      };
    }

    // Create execution record
    const execution: WorkflowExecution = {
      id: generateExecutionId(),
      workflowId,
      tenantId: context.tenantId,
      userId: context.userId,
      status: 'running',
      startTime: new Date(),
      results: [],
      errors: [],
      metadata: {}
    };

    this.executions.set(execution.id, execution);

    try {
      // Execute workflow
      const result = await workflow.run(context);
      
      // Update execution record
      execution.status = result.success ? 'completed' : 'failed';
      execution.endTime = new Date();
      
      if (result.errors) {
        execution.errors.push(...result.errors);
      }

      return result;

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.errors.push({
        code: 'WORKFLOW_EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: false,
        timestamp: new Date()
      });

      return {
        success: false,
        message: 'Workflow execution failed',
        errors: execution.errors,
        statusCode: 500
      };
    }
  }

  /**
   * Get workflow execution status
   */
  getExecutionStatus(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Get all executions for a tenant
   */
  getTenantExecutions(tenantId: string): WorkflowExecution[] {
    return Array.from(this.executions.values())
      .filter(execution => execution.tenantId === tenantId);
  }

  /**
   * Get available workflows for a tenant
   */
  getTenantWorkflows(tenantId: string): string[] {
    return this.tenantWorkflows.get(tenantId) || [];
  }

  /**
   * Cancel a workflow execution
   */
  async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'running') {
      return false;
    }

    execution.status = 'cancelled';
    execution.endTime = new Date();
    return true;
  }

  /**
   * Retry a failed workflow execution
   */
  async retryExecution(
    executionId: string,
    context: WorkflowContext
  ): Promise<WorkflowResult> {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'failed') {
      return {
        success: false,
        message: 'Cannot retry execution',
        statusCode: 400
      };
    }

    // Reset execution
    execution.status = 'running';
    execution.startTime = new Date();
    execution.endTime = undefined;
    execution.errors = [];

    // Execute workflow
    return this.executeWorkflow(execution.workflowId, context);
  }

  /**
   * Get workflow statistics
   */
  getWorkflowStatistics(tenantId?: string): WorkflowStatistics {
    const executions = tenantId ? 
      this.getTenantExecutions(tenantId) : 
      Array.from(this.executions.values());

    const total = executions.length;
    const completed = executions.filter(e => e.status === 'completed').length;
    const failed = executions.filter(e => e.status === 'failed').length;
    const running = executions.filter(e => e.status === 'running').length;
    const cancelled = executions.filter(e => e.status === 'cancelled').length;

    return {
      total,
      completed,
      failed,
      running,
      cancelled,
      successRate: total > 0 ? (completed / total) * 100 : 0
    };
  }

  /**
   * Clean up old executions
   */
  cleanupExecutions(olderThanDays: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let cleaned = 0;
    for (const [id, execution] of this.executions.entries()) {
      if (execution.endTime && execution.endTime < cutoffDate) {
        this.executions.delete(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Check tenant permissions for workflow
   */
  private checkTenantPermissions(workflowId: string, context: WorkflowContext): boolean {
    // Check if workflow is tenant-specific
    const tenantWorkflows = this.tenantWorkflows.get(context.tenantId);
    if (tenantWorkflows && !tenantWorkflows.includes(workflowId)) {
      return false;
    }

    // Check cross-tenant access
    if (context.crossTenantAccess && !context.userPermissions.includes('cross-tenant-access')) {
      return false;
    }

    return true;
  }
}

export interface WorkflowStatistics {
  total: number;
  completed: number;
  failed: number;
  running: number;
  cancelled: number;
  successRate: number;
}

/**
 * Generate unique execution ID
 */
function generateExecutionId(): string {
  return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Global workflow manager instance
 */
export const workflowManager = new WorkflowManager();
