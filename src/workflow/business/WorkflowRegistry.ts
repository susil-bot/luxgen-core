/**
 * LUXGEN WORKFLOW REGISTRY
 * Central registry for all business logic workflows
 */

import { 
  WorkflowFactory, 
  WorkflowRegistry as BaseWorkflowRegistry,
  workflowManager,
  WorkflowContext,
  WorkflowResult
} from '../index';
import { JobPostWorkflow } from './JobPostWorkflow';
import { UserManagementWorkflow } from './UserManagementWorkflow';
import { FeedManagementWorkflow } from './FeedManagementWorkflow';

export class BusinessWorkflowRegistry {
  private static instance: BusinessWorkflowRegistry;
  private workflows: Map<string, any> = new Map();

  private constructor() {
    this.initializeWorkflows();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): BusinessWorkflowRegistry {
    if (!BusinessWorkflowRegistry.instance) {
      BusinessWorkflowRegistry.instance = new BusinessWorkflowRegistry();
    }
    return BusinessWorkflowRegistry.instance;
  }

  /**
   * Initialize all business workflows
   */
  private initializeWorkflows(): void {
    console.log('🚀 Initializing LuxGen Business Workflows...');

    // Job Post Management Workflow
    const jobPostWorkflow = new JobPostWorkflow();
    this.registerWorkflow('job-post-management', jobPostWorkflow);
    console.log('✅ Job Post Management Workflow registered');

    // User Management Workflow
    const userManagementWorkflow = new UserManagementWorkflow();
    this.registerWorkflow('user-management', userManagementWorkflow);
    console.log('✅ User Management Workflow registered');

    // Feed Management Workflow
    const feedManagementWorkflow = new FeedManagementWorkflow();
    this.registerWorkflow('feed-management', feedManagementWorkflow);
    console.log('✅ Feed Management Workflow registered');

    // Tenant-specific workflows
    this.initializeTenantWorkflows();

    console.log('🎉 All business workflows initialized successfully');
  }

  /**
   * Initialize tenant-specific workflows
   */
  private initializeTenantWorkflows(): void {
    const tenants = ['luxgen', 'demo'];

    tenants.forEach(tenantId => {
      // Create tenant-specific job post workflow
      const tenantJobWorkflow = WorkflowFactory.createTenantWorkflow(
        'job-post-management',
        tenantId,
        tenantId
      );
      this.registerWorkflow(`${tenantId}_job-post-management`, tenantJobWorkflow);

      // Create tenant-specific user management workflow
      const tenantUserWorkflow = WorkflowFactory.createTenantWorkflow(
        'user-management',
        tenantId,
        tenantId
      );
      this.registerWorkflow(`${tenantId}_user-management`, tenantUserWorkflow);

      // Create tenant-specific feed management workflow
      const tenantFeedWorkflow = WorkflowFactory.createTenantWorkflow(
        'feed-management',
        tenantId,
        tenantId
      );
      this.registerWorkflow(`${tenantId}_feed-management`, tenantFeedWorkflow);

      console.log(`✅ Tenant-specific workflows registered for ${tenantId}`);
    });
  }

  /**
   * Register a workflow
   */
  public registerWorkflow(workflowId: string, workflow: any): void {
    this.workflows.set(workflowId, workflow);
    BaseWorkflowRegistry.register(workflowId, workflow);
  }

  /**
   * Get a workflow
   */
  public getWorkflow(workflowId: string): any {
    return this.workflows.get(workflowId);
  }

  /**
   * Get all workflows
   */
  public getAllWorkflows(): Map<string, any> {
    return new Map(this.workflows);
  }

  /**
   * Execute a business workflow
   */
  public async executeWorkflow(
    workflowId: string,
    context: WorkflowContext
  ): Promise<WorkflowResult> {
    try {
      // Check if workflow exists
      if (!this.workflows.has(workflowId)) {
        return {
          success: false,
          message: `Workflow not found: ${workflowId}`,
          statusCode: 404
        };
      }

      // Execute workflow
      const result = await workflowManager.executeWorkflow(workflowId, context);

      return result;

    } catch (error) {
      console.error(`Error executing workflow ${workflowId}:`, error);
      return {
        success: false,
        message: 'Workflow execution failed',
        errors: [{
          code: 'WORKFLOW_EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
          timestamp: new Date()
        }],
        statusCode: 500
      };
    }
  }

  /**
   * Get workflow statistics
   */
  public getWorkflowStatistics(tenantId?: string): any {
    return workflowManager.getWorkflowStatistics(tenantId);
  }

  /**
   * Get available workflows for a tenant
   */
  public getTenantWorkflows(tenantId: string): string[] {
    return workflowManager.getTenantWorkflows(tenantId);
  }

  /**
   * Get workflow execution status
   */
  public getExecutionStatus(executionId: string): any {
    return workflowManager.getExecutionStatus(executionId);
  }

  /**
   * Get all executions for a tenant
   */
  public getTenantExecutions(tenantId: string): any[] {
    return workflowManager.getTenantExecutions(tenantId);
  }

  /**
   * Clean up old executions
   */
  public cleanupExecutions(olderThanDays: number = 30): number {
    return workflowManager.cleanupExecutions(olderThanDays);
  }

  /**
   * Get workflow health status
   */
  public getWorkflowHealth(): any {
    const allWorkflows = this.getAllWorkflows();
    const healthStatus = {
      totalWorkflows: allWorkflows.size,
      registeredWorkflows: Array.from(allWorkflows.keys()),
      timestamp: new Date().toISOString(),
      status: 'healthy'
    };

    return healthStatus;
  }

  /**
   * Get business workflow endpoints
   */
  public getBusinessEndpoints(): any {
    return {
      'job-post-management': {
        description: 'Job post creation and management',
        endpoints: [
          'POST /api/v1/jobs',
          'PUT /api/v1/jobs/:id',
          'DELETE /api/v1/jobs/:id'
        ],
        permissions: ['job-post-create', 'job-post-manage']
      },
      'user-management': {
        description: 'User creation and management',
        endpoints: [
          'POST /api/v1/users',
          'PUT /api/v1/users/:id',
          'DELETE /api/v1/users/:id'
        ],
        permissions: ['user-create', 'user-manage']
      },
      'feed-management': {
        description: 'Feed content management',
        endpoints: [
          'POST /api/v1/feed',
          'PUT /api/v1/feed/:id',
          'DELETE /api/v1/feed/:id'
        ],
        permissions: ['content-create', 'content-manage']
      }
    };
  }

  /**
   * Validate workflow context
   */
  public validateWorkflowContext(context: WorkflowContext): boolean {
    // Check required fields
    if (!context.tenantId || !context.tenantConfig) {
      return false;
    }

    // Check user context if required
    if (context.userId && !context.userRole) {
      return false;
    }

    // Check tenant isolation
    if (context.isTenantIsolated && !context.tenantId) {
      return false;
    }

    return true;
  }

  /**
   * Get workflow by tenant and type
   */
  public getWorkflowByTenantAndType(tenantId: string, workflowType: string): any {
    const workflowId = `${tenantId}_${workflowType}`;
    return this.getWorkflow(workflowId);
  }

  /**
   * List all available workflows
   */
  public listAvailableWorkflows(): any[] {
    const workflows: any[] = [];
    
    for (const [id, workflow] of this.workflows.entries()) {
      workflows.push({
        id,
        name: workflow.constructor.name,
        tenantSpecific: id.includes('_'),
        available: true
      });
    }

    return workflows;
  }

  /**
   * Get workflow documentation
   */
  public getWorkflowDocumentation(workflowId: string): any {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) {
      return null;
    }

    return {
      id: workflowId,
      name: workflow.constructor.name,
      description: 'Business logic workflow',
      steps: workflow.workflowDefinition?.steps || [],
      triggers: workflow.workflowDefinition?.triggers || [],
      conditions: workflow.workflowDefinition?.conditions || [],
      errorHandling: workflow.workflowDefinition?.errorHandling || {},
      tenantSpecific: workflow.workflowDefinition?.tenantSpecific || false,
      crossTenantAllowed: workflow.workflowDefinition?.crossTenantAllowed || false
    };
  }
}

// Export singleton instance
export const businessWorkflowRegistry = BusinessWorkflowRegistry.getInstance();

// Export for convenience
export { BusinessWorkflowRegistry };
