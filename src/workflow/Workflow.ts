/**
 * LUXGEN WORKFLOW INTERFACE
 * Core workflow interface for multi-tenancy data flow
 */

import { WorkflowContext } from './WorkflowContext';
import { WorkflowResult } from './WorkflowResult';

export interface Workflow {
  /**
   * Execute the workflow with the given context
   */
  run(workflowContext: WorkflowContext): Promise<WorkflowResult>;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  conditions: WorkflowCondition[];
  errorHandling: WorkflowErrorHandling;
  tenantSpecific: boolean;
  crossTenantAllowed: boolean;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'validation' | 'transformation' | 'business-logic' | 'data-access' | 'notification';
  dependencies: string[];
  timeout: number;
  retryable: boolean;
  critical: boolean;
  handler: WorkflowStepHandler;
}

export interface WorkflowTrigger {
  type: 'api-call' | 'scheduled' | 'event' | 'manual';
  conditions: Record<string, any>;
  schedule?: string;
  event?: string;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not-equals' | 'contains' | 'greater-than' | 'less-than';
  value: any;
  required: boolean;
}

export interface WorkflowErrorHandling {
  strategy: 'fail-fast' | 'continue-on-error' | 'retry' | 'fallback';
  maxRetries: number;
  retryDelay: number;
  fallbackWorkflow?: string;
  notifications: NotificationConfig[];
}

export interface NotificationConfig {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  recipients: string[];
  template: string;
  conditions: Record<string, any>;
}

export interface WorkflowStepHandler {
  (context: WorkflowContext): Promise<WorkflowResult>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  tenantId: string;
  userId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  currentStep?: string;
  results: WorkflowStepResult[];
  errors: WorkflowError[];
  metadata: Record<string, any>;
}

export interface WorkflowStepResult {
  stepId: string;
  stepName: string;
  success: boolean;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  data?: any;
  errors?: WorkflowError[];
  retryCount: number;
}

export interface WorkflowError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stepId?: string;
  retryable: boolean;
  timestamp: Date;
}

/**
 * Base workflow implementation
 */
export abstract class BaseWorkflow implements Workflow {
  protected workflowDefinition: WorkflowDefinition;
  protected executionContext: WorkflowExecution;

  constructor(workflowDefinition: WorkflowDefinition) {
    this.workflowDefinition = workflowDefinition;
    this.executionContext = {
      id: generateExecutionId(),
      workflowId: workflowDefinition.id,
      tenantId: '',
      status: 'pending',
      startTime: new Date(),
      results: [],
      errors: [],
      metadata: {}
    };
  }

  /**
   * Execute the workflow
   */
  async run(workflowContext: WorkflowContext): Promise<WorkflowResult> {
    try {
      this.executionContext.tenantId = workflowContext.tenantId;
      this.executionContext.userId = workflowContext.userId;
      this.executionContext.status = 'running';
      this.executionContext.startTime = new Date();

      // Validate workflow context
      if (!this.validateContext(workflowContext)) {
        return this.createErrorResult('Invalid workflow context', []);
      }

      // Check tenant permissions
      if (!this.checkTenantPermissions(workflowContext)) {
        return this.createErrorResult('Insufficient tenant permissions', []);
      }

      // Execute workflow steps
      const result = await this.executeSteps(workflowContext);

      this.executionContext.status = result.success ? 'completed' : 'failed';
      this.executionContext.endTime = new Date();

      return result;

    } catch (error) {
      this.executionContext.status = 'failed';
      this.executionContext.endTime = new Date();
      this.executionContext.errors.push({
        code: 'WORKFLOW_EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: false,
        timestamp: new Date()
      });

      return this.createErrorResult(
        'Workflow execution failed',
        this.executionContext.errors
      );
    }
  }

  /**
   * Execute workflow steps
   */
  protected async executeSteps(workflowContext: WorkflowContext): Promise<WorkflowResult> {
    const results: WorkflowResult[] = [];
    const errors: WorkflowError[] = [];

    for (const step of this.workflowDefinition.steps) {
      try {
        // Check dependencies
        if (!this.checkDependencies(step, results)) {
          const error = {
            code: 'DEPENDENCY_NOT_MET',
            message: `Dependencies not met for step: ${step.name}`,
            stepId: step.id,
            retryable: false,
            timestamp: new Date()
          };
          errors.push(error);
          
          if (step.critical) {
            return this.createErrorResult('Critical step failed', errors);
          }
          continue;
        }

        // Execute step
        const stepResult = await this.executeStep(step, workflowContext);
        results.push(stepResult);

        // Handle step errors
        if (!stepResult.success && stepResult.errors) {
          errors.push(...stepResult.errors);
          
          if (step.critical) {
            return this.createErrorResult('Critical step failed', errors);
          }
        }

      } catch (error) {
        const workflowError = {
          code: 'STEP_EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          stepId: step.id,
          retryable: step.retryable,
          timestamp: new Date()
        };
        errors.push(workflowError);

        if (step.critical) {
          return this.createErrorResult('Critical step failed', errors);
        }
      }
    }

    // Determine overall success
    const success = errors.length === 0;
    const message = success ? 'Workflow completed successfully' : 'Workflow completed with errors';

    return {
      success,
      message,
      data: results.map(r => r.data).filter(d => d !== undefined),
      errors: errors.length > 0 ? errors : undefined,
      statusCode: success ? 200 : 500,
      metadata: {
        executionId: this.executionContext.id,
        startTime: this.executionContext.startTime,
        endTime: this.executionContext.endTime,
        duration: this.executionContext.endTime ? 
          this.executionContext.endTime.getTime() - this.executionContext.startTime.getTime() : undefined,
        steps: this.executionContext.results,
        performance: {
          memoryUsage: process.memoryUsage().heapUsed,
          cpuUsage: 0,
          databaseQueries: 0,
          apiCalls: 0,
          cacheHits: 0,
          cacheMisses: 0,
          responseTime: 0
        },
        auditTrail: [],
        tenantContext: {
          tenantId: workflowContext.tenantId,
          tenantSlug: workflowContext.tenantSlug,
          tenantName: workflowContext.tenantConfig.name,
          features: workflowContext.tenantConfig.features,
          limits: workflowContext.tenantConfig.limits,
          security: workflowContext.tenantConfig.security
        }
      }
    };
  }

  /**
   * Execute a single workflow step
   */
  protected async executeStep(
    step: WorkflowStep,
    workflowContext: WorkflowContext
  ): Promise<WorkflowResult> {
    const stepStartTime = new Date();
    let retryCount = 0;
    const maxRetries = this.workflowDefinition.errorHandling.maxRetries;

    while (retryCount <= maxRetries) {
      try {
        const result = await step.handler(workflowContext);
        
        this.executionContext.results.push({
          stepId: step.id,
          stepName: step.name,
          success: result.success,
          startTime: stepStartTime,
          endTime: new Date(),
          duration: new Date().getTime() - stepStartTime.getTime(),
          data: result.data,
          errors: result.errors,
          retryCount
        });

        return result;

      } catch (error) {
        retryCount++;
        
        if (retryCount > maxRetries) {
          throw error;
        }

        // Wait before retry
        await new Promise(resolve => 
          setTimeout(resolve, this.workflowDefinition.errorHandling.retryDelay)
        );
      }
    }

    throw new Error('Step execution failed after maximum retries');
  }

  /**
   * Check if dependencies are met
   */
  protected checkDependencies(step: WorkflowStep, results: WorkflowResult[]): boolean {
    if (step.dependencies.length === 0) {
      return true;
    }

    return step.dependencies.every(depId => {
      const depResult = results.find(r => 
        r.metadata?.steps.some(s => s.stepId === depId && s.success)
      );
      return depResult !== undefined;
    });
  }

  /**
   * Validate workflow context
   */
  protected validateContext(workflowContext: WorkflowContext): boolean {
    // Check tenant isolation
    if (workflowContext.isTenantIsolated && !workflowContext.tenantId) {
      return false;
    }

    // Check user context if required
    if (workflowContext.userId && !workflowContext.userRole) {
      return false;
    }

    // Check data encryption if required
    if (workflowContext.dataEncryption && !workflowContext.tenantConfig.security.encryptionEnabled) {
      return false;
    }

    return true;
  }

  /**
   * Check tenant permissions
   */
  protected checkTenantPermissions(workflowContext: WorkflowContext): boolean {
    // Check if workflow is tenant-specific
    if (this.workflowDefinition.tenantSpecific && !workflowContext.tenantId) {
      return false;
    }

    // Check cross-tenant access
    if (this.workflowDefinition.crossTenantAllowed && !workflowContext.crossTenantAccess) {
      return false;
    }

    return true;
  }

  /**
   * Create error result
   */
  protected createErrorResult(message: string, errors: WorkflowError[]): WorkflowResult {
    return {
      success: false,
      message,
      errors,
      statusCode: 500,
      metadata: {
        executionId: this.executionContext.id,
        startTime: this.executionContext.startTime,
        endTime: this.executionContext.endTime,
        duration: this.executionContext.endTime ? 
          this.executionContext.endTime.getTime() - this.executionContext.startTime.getTime() : undefined,
        steps: this.executionContext.results,
        performance: {
          memoryUsage: process.memoryUsage().heapUsed,
          cpuUsage: 0,
          databaseQueries: 0,
          apiCalls: 0,
          cacheHits: 0,
          cacheMisses: 0,
          responseTime: 0
        },
        auditTrail: [],
        tenantContext: {
          tenantId: this.executionContext.tenantId,
          tenantSlug: '',
          tenantName: '',
          features: [],
          limits: {
            maxUsers: 0,
            maxStorage: 0,
            maxApiCalls: 0,
            maxConcurrentSessions: 0,
            dataRetentionDays: 0
          },
          security: {
            encryptionEnabled: false,
            ssoEnabled: false,
            mfaRequired: false,
            sessionTimeout: 0
          }
        }
      }
    };
  }
}

/**
 * Generate unique execution ID
 */
function generateExecutionId(): string {
  return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
