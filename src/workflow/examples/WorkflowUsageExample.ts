/**
 * LUXGEN WORKFLOW USAGE EXAMPLE
 * Comprehensive example of how to use the workflow system
 */

import { 
  WorkflowFactory, 
  WorkflowRegistry, 
  WorkflowUtils, 
  workflowManager,
  WorkflowContext,
  WorkflowResult
} from '../index';
import { UserRegistrationWorkflow } from './UserRegistrationWorkflow';
import { Request, Response } from 'express';

/**
 * Example: Setting up workflows
 */
export function setupWorkflows() {
  // Register user registration workflow
  const userRegistrationWorkflow = new UserRegistrationWorkflow();
  WorkflowRegistry.register('user-registration', userRegistrationWorkflow);

  // Create tenant-specific workflow
  const tenantWorkflow = WorkflowFactory.createTenantWorkflow(
    'user-management',
    'luxgen',
    'luxgen'
  );
  WorkflowRegistry.register('luxgen_user-management', tenantWorkflow);

  // Create cross-tenant workflow
  const crossTenantWorkflow = WorkflowFactory.createCrossTenantWorkflow(
    'analytics',
    ['luxgen', 'demo']
  );
  WorkflowRegistry.register('cross_tenant_analytics', crossTenantWorkflow);
}

/**
 * Example: Using workflow in Express route
 */
export function setupWorkflowRoutes(app: any) {
  // User registration route with workflow
  app.post('/api/v1/auth/register', async (req: Request, res: Response) => {
    try {
      // Create workflow context
      const context = WorkflowUtils.createContext(
        req,
        res,
        req.tenantId || 'luxgen',
        req.tenantSlug || 'luxgen',
        req.tenant || getDefaultTenantConfig(),
        req.user?.id,
        req.user?.role
      );

      // Execute workflow
      const result = await workflowManager.executeWorkflow('user-registration', context);

      if (result.success) {
        res.status(201).json({
          success: true,
          message: 'User registered successfully',
          data: result.data,
          workflowId: result.metadata?.executionId
        });
      } else {
        res.status(result.statusCode || 400).json({
          success: false,
          message: result.message,
          errors: result.errors
        });
      }

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get workflow execution status
  app.get('/api/v1/workflows/:executionId/status', async (req: Request, res: Response) => {
    try {
      const { executionId } = req.params;
      const execution = workflowManager.getExecutionStatus(executionId);

      if (!execution) {
        return res.status(404).json({
          success: false,
          message: 'Execution not found'
        });
      }

      res.json({
        success: true,
        data: execution
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get execution status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get tenant workflows
  app.get('/api/v1/workflows/tenant/:tenantId', async (req: Request, res: Response) => {
    try {
      const { tenantId } = req.params;
      const workflows = workflowManager.getTenantWorkflows(tenantId);

      res.json({
        success: true,
        data: { workflows }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get tenant workflows',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get workflow statistics
  app.get('/api/v1/workflows/statistics', async (req: Request, res: Response) => {
    try {
      const tenantId = req.query.tenantId as string;
      const statistics = workflowManager.getWorkflowStatistics(tenantId);

      res.json({
        success: true,
        data: statistics
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get workflow statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

/**
 * Example: Using workflow middleware
 */
export function setupWorkflowMiddleware(app: any) {
  const { workflowMiddleware, tenantWorkflowMiddleware, workflowResultHandler } = require('../WorkflowMiddleware');

  // Apply workflow middleware to specific routes
  app.post('/api/v1/users', 
    workflowMiddleware({ 
      workflowId: 'user-registration',
      tenantSpecific: true,
      timeout: 30000
    }),
    workflowResultHandler(),
    (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'User created via workflow',
        data: req.workflowData
      });
    }
  );

  // Apply tenant-specific workflow middleware
  app.post('/api/v1/tenant/:tenantId/users',
    tenantWorkflowMiddleware('user-management', 'luxgen', 'luxgen'),
    workflowResultHandler(),
    (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Tenant user created via workflow',
        data: req.workflowData
      });
    }
  );
}

/**
 * Example: Custom workflow implementation
 */
export class CustomWorkflow extends BaseWorkflow {
  constructor() {
    const definition = {
      id: 'custom-workflow',
      name: 'Custom Workflow',
      version: '1.0.0',
      description: 'Custom workflow example',
      steps: [
        {
          id: 'step1',
          name: 'Step 1',
          type: 'validation' as const,
          dependencies: [],
          timeout: 5000,
          retryable: true,
          critical: true,
          handler: this.step1.bind(this)
        },
        {
          id: 'step2',
          name: 'Step 2',
          type: 'business-logic' as const,
          dependencies: ['step1'],
          timeout: 10000,
          retryable: true,
          critical: false,
          handler: this.step2.bind(this)
        }
      ],
      triggers: [],
      conditions: [],
      errorHandling: {
        strategy: 'retry' as const,
        maxRetries: 3,
        retryDelay: 1000,
        notifications: []
      },
      tenantSpecific: true,
      crossTenantAllowed: false
    };

    super(definition);
  }

  private async step1(context: WorkflowContext): Promise<WorkflowResult> {
    // Custom step 1 logic
    return {
      success: true,
      message: 'Step 1 completed',
      data: { step1: 'completed' }
    };
  }

  private async step2(context: WorkflowContext): Promise<WorkflowResult> {
    // Custom step 2 logic
    return {
      success: true,
      message: 'Step 2 completed',
      data: { step2: 'completed' }
    };
  }
}

/**
 * Example: Workflow monitoring and management
 */
export class WorkflowMonitor {
  /**
   * Monitor workflow executions
   */
  static async monitorExecutions(tenantId: string) {
    const executions = workflowManager.getTenantExecutions(tenantId);
    const statistics = workflowManager.getWorkflowStatistics(tenantId);

    console.log(`Workflow Monitor for Tenant: ${tenantId}`);
    console.log(`Total Executions: ${statistics.total}`);
    console.log(`Success Rate: ${statistics.successRate.toFixed(2)}%`);
    console.log(`Running: ${statistics.running}`);
    console.log(`Failed: ${statistics.failed}`);

    return { executions, statistics };
  }

  /**
   * Clean up old executions
   */
  static async cleanupOldExecutions(olderThanDays: number = 30) {
    const cleaned = workflowManager.cleanupExecutions(olderThanDays);
    console.log(`Cleaned up ${cleaned} old executions`);
    return cleaned;
  }

  /**
   * Get workflow health status
   */
  static async getWorkflowHealth() {
    const allWorkflows = WorkflowRegistry.getAll();
    const healthStatus = {
      totalWorkflows: allWorkflows.size,
      registeredWorkflows: Array.from(allWorkflows.keys()),
      timestamp: new Date().toISOString()
    };

    return healthStatus;
  }
}

/**
 * Example: Error handling and retry logic
 */
export class WorkflowErrorHandler {
  /**
   * Handle workflow errors
   */
  static async handleWorkflowError(
    error: Error,
    context: WorkflowContext,
    workflowId: string
  ): Promise<WorkflowResult> {
    console.error(`Workflow Error in ${workflowId}:`, error);

    // Log error to audit trail
    context.auditTrail.push({
      timestamp: new Date(),
      action: 'workflow_error',
      userId: context.userId,
      tenantId: context.tenantId,
      resource: workflowId,
      details: {
        error: error.message,
        stack: error.stack,
        context: context.metadata
      }
    });

    // Return error result
    return {
      success: false,
      message: 'Workflow execution failed',
      errors: [{
        code: 'WORKFLOW_ERROR',
        message: error.message,
        retryable: true,
        timestamp: new Date()
      }],
      statusCode: 500
    };
  }

  /**
   * Retry failed workflow
   */
  static async retryWorkflow(
    executionId: string,
    context: WorkflowContext
  ): Promise<WorkflowResult> {
    try {
      const result = await workflowManager.retryExecution(executionId, context);
      return result;
    } catch (error) {
      return this.handleWorkflowError(error as Error, context, 'retry');
    }
  }
}

/**
 * Get default tenant configuration
 */
function getDefaultTenantConfig() {
  return {
    id: 'luxgen',
    slug: 'luxgen',
    name: 'LuxGen Technologies',
    features: ['user-management', 'analytics', 'reporting'],
    limits: {
      maxUsers: 1000,
      maxStorage: 1000000,
      maxApiCalls: 10000,
      maxConcurrentSessions: 100,
      dataRetentionDays: 365
    },
    branding: {
      primaryColor: '#FF6B35',
      secondaryColor: '#2C3E50'
    },
    security: {
      encryptionEnabled: true,
      ssoEnabled: false,
      mfaRequired: false,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        maxAge: 90
      },
      sessionTimeout: 3600
    },
    dataRetention: {
      userData: 365,
      activityLogs: 90,
      auditLogs: 2555,
      temporaryData: 7,
      backupRetention: 30
    }
  };
}

// Export examples
export {
  setupWorkflows,
  setupWorkflowRoutes,
  setupWorkflowMiddleware,
  CustomWorkflow,
  WorkflowMonitor,
  WorkflowErrorHandler
};
