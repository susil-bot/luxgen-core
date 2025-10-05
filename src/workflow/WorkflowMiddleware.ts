/**
 * LUXGEN WORKFLOW MIDDLEWARE
 * Express middleware for workflow integration
 */

import { Request, Response, NextFunction } from 'express';
import { WorkflowContext } from './WorkflowContext';
import { WorkflowResult } from './WorkflowResult';
import { workflowManager } from './WorkflowManager';
import { TenantWorkflow } from './TenantWorkflow';
import { WorkflowDefinition } from './Workflow';

export interface WorkflowMiddlewareOptions {
  workflowId: string;
  tenantSpecific?: boolean;
  crossTenantAllowed?: boolean;
  timeout?: number;
  retryCount?: number;
}

/**
 * Workflow middleware for Express
 */
export function workflowMiddleware(options: WorkflowMiddlewareOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Create workflow context
      const workflowContext = createWorkflowContextFromRequest(req, res);
      
      // Execute workflow
      const result = await executeWorkflowWithOptions(workflowContext, options);
      
      // Handle workflow result
      if (result.success) {
        req.workflowResult = result;
        next();
      } else {
        res.status(result.statusCode || 500).json({
          success: false,
          message: result.message,
          errors: result.errors
        });
      }

    } catch (error) {
      console.error('Workflow middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Workflow execution failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

/**
 * Create workflow context from Express request
 */
function createWorkflowContextFromRequest(req: Request, res: Response): WorkflowContext {
  return {
    request: req,
    response: res,
    tenantId: req.tenantId || 'default',
    tenantSlug: req.tenantSlug || 'luxgen',
    tenantConfig: req.tenant || {
      id: 'default',
      slug: 'luxgen',
      name: 'LuxGen Technologies',
      features: [],
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
    },
    userId: req.user?.id,
    userRole: req.user?.role,
    userPermissions: req.user?.permissions || [],
    data: req.body,
    metadata: {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    },
    workflowId: generateWorkflowId(),
    stepId: 'initial',
    startTime: new Date(),
    timeout: 30000,
    retryCount: 0,
    maxRetries: 3,
    isTenantIsolated: true,
    crossTenantAccess: false,
    dataEncryption: true,
    performanceMetrics: {
      startTime: new Date(),
      memoryUsage: process.memoryUsage().heapUsed,
      cpuUsage: 0,
      databaseQueries: 0,
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0
    },
    errorContext: {
      hasError: false,
      retryable: true,
      userFriendlyMessage: ''
    },
    auditTrail: []
  };
}

/**
 * Execute workflow with options
 */
async function executeWorkflowWithOptions(
  context: WorkflowContext,
  options: WorkflowMiddlewareOptions
): Promise<WorkflowResult> {
  try {
    // Set timeout
    if (options.timeout) {
      context.timeout = options.timeout;
    }

    // Set retry count
    if (options.retryCount) {
      context.maxRetries = options.retryCount;
    }

    // Execute workflow
    const result = await workflowManager.executeWorkflow(options.workflowId, context);
    
    return result;

  } catch (error) {
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
 * Tenant-specific workflow middleware
 */
export function tenantWorkflowMiddleware(
  workflowId: string,
  tenantId: string,
  tenantSlug: string
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Create tenant-specific workflow
      const workflowDefinition: WorkflowDefinition = {
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

      const tenantWorkflow = new TenantWorkflow(workflowDefinition, tenantId, tenantSlug);
      
      // Create workflow context
      const workflowContext = createWorkflowContextFromRequest(req, res);
      
      // Execute tenant workflow
      const result = await tenantWorkflow.run(workflowContext);
      
      // Handle result
      if (result.success) {
        req.workflowResult = result;
        next();
      } else {
        res.status(result.statusCode || 500).json({
          success: false,
          message: result.message,
          errors: result.errors
        });
      }

    } catch (error) {
      console.error('Tenant workflow middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Tenant workflow execution failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

/**
 * Workflow result handler middleware
 */
export function workflowResultHandler() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.workflowResult) {
      const result = req.workflowResult as WorkflowResult;
      
      // Add workflow metadata to response
      res.set('X-Workflow-Id', result.metadata?.executionId || '');
      res.set('X-Workflow-Status', result.success ? 'success' : 'error');
      
      // Include workflow result in response
      if (result.data) {
        req.workflowData = result.data;
      }
    }
    
    next();
  };
}

/**
 * Workflow error handler middleware
 */
export function workflowErrorHandler() {
  return (error: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Workflow error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Workflow execution failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  };
}

/**
 * Generate unique workflow ID
 */
function generateWorkflowId(): string {
  return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      workflowResult?: WorkflowResult;
      workflowData?: any;
    }
  }
}
