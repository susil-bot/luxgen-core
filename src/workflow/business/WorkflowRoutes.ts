/**
 * LUXGEN WORKFLOW ROUTES
 * Express routes for business workflow integration
 */

import { Request, Response, NextFunction } from 'express';
import { businessWorkflowRegistry } from './WorkflowRegistry';
import { WorkflowUtils } from '../index';
import { WorkflowContext } from '../WorkflowContext';

/**
 * Job Post Workflow Routes
 */
export function setupJobPostRoutes(app: any) {
  // Create job post
  app.post('/api/v1/jobs', async (req: Request, res: Response) => {
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

      // Execute job post workflow
      const result = await businessWorkflowRegistry.executeWorkflow(
        'job-post-management',
        context
      );

      if (result.success) {
        res.status(201).json({
          success: true,
          message: 'Job post created successfully',
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
        message: 'Job post creation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update job post
  app.put('/api/v1/jobs/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
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

      // Add job ID to context
      context.data = { ...context.data, jobId: id };

      // Execute job post workflow
      const result = await businessWorkflowRegistry.executeWorkflow(
        'job-post-management',
        context
      );

      if (result.success) {
        res.json({
          success: true,
          message: 'Job post updated successfully',
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
        message: 'Job post update failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

/**
 * User Management Workflow Routes
 */
export function setupUserManagementRoutes(app: any) {
  // Create user
  app.post('/api/v1/users', async (req: Request, res: Response) => {
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

      // Execute user management workflow
      const result = await businessWorkflowRegistry.executeWorkflow(
        'user-management',
        context
      );

      if (result.success) {
        res.status(201).json({
          success: true,
          message: 'User created successfully',
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
        message: 'User creation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update user
  app.put('/api/v1/users/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
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

      // Add user ID to context
      context.data = { ...context.data, userId: id };

      // Execute user management workflow
      const result = await businessWorkflowRegistry.executeWorkflow(
        'user-management',
        context
      );

      if (result.success) {
        res.json({
          success: true,
          message: 'User updated successfully',
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
        message: 'User update failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

/**
 * Feed Management Workflow Routes
 */
export function setupFeedManagementRoutes(app: any) {
  // Create feed content
  app.post('/api/v1/feed', async (req: Request, res: Response) => {
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

      // Execute feed management workflow
      const result = await businessWorkflowRegistry.executeWorkflow(
        'feed-management',
        context
      );

      if (result.success) {
        res.status(201).json({
          success: true,
          message: 'Feed content created successfully',
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
        message: 'Feed content creation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update feed content
  app.put('/api/v1/feed/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
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

      // Add feed ID to context
      context.data = { ...context.data, feedId: id };

      // Execute feed management workflow
      const result = await businessWorkflowRegistry.executeWorkflow(
        'feed-management',
        context
      );

      if (result.success) {
        res.json({
          success: true,
          message: 'Feed content updated successfully',
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
        message: 'Feed content update failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

/**
 * Workflow Management Routes
 */
export function setupWorkflowManagementRoutes(app: any) {
  // Get workflow statistics
  app.get('/api/v1/workflows/statistics', async (req: Request, res: Response) => {
    try {
      const tenantId = req.query.tenantId as string;
      const statistics = businessWorkflowRegistry.getWorkflowStatistics(tenantId);

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

  // Get workflow execution status
  app.get('/api/v1/workflows/:executionId/status', async (req: Request, res: Response) => {
    try {
      const { executionId } = req.params;
      const execution = businessWorkflowRegistry.getExecutionStatus(executionId);

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
      const workflows = businessWorkflowRegistry.getTenantWorkflows(tenantId);

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

  // Get workflow health
  app.get('/api/v1/workflows/health', async (req: Request, res: Response) => {
    try {
      const health = businessWorkflowRegistry.getWorkflowHealth();

      res.json({
        success: true,
        data: health
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get workflow health',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get available workflows
  app.get('/api/v1/workflows', async (req: Request, res: Response) => {
    try {
      const workflows = businessWorkflowRegistry.listAvailableWorkflows();

      res.json({
        success: true,
        data: { workflows }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get available workflows',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get workflow documentation
  app.get('/api/v1/workflows/:workflowId/documentation', async (req: Request, res: Response) => {
    try {
      const { workflowId } = req.params;
      const documentation = businessWorkflowRegistry.getWorkflowDocumentation(workflowId);

      if (!documentation) {
        return res.status(404).json({
          success: false,
          message: 'Workflow not found'
        });
      }

      res.json({
        success: true,
        data: documentation
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get workflow documentation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

/**
 * Setup all workflow routes
 */
export function setupAllWorkflowRoutes(app: any) {
  console.log('🚀 Setting up LuxGen Workflow Routes...');

  // Setup business workflow routes
  setupJobPostRoutes(app);
  setupUserManagementRoutes(app);
  setupFeedManagementRoutes(app);
  setupWorkflowManagementRoutes(app);

  console.log('✅ All workflow routes setup successfully');
}

/**
 * Get default tenant configuration
 */
function getDefaultTenantConfig() {
  return {
    id: 'luxgen',
    slug: 'luxgen',
    name: 'LuxGen Technologies',
    features: ['user-management', 'job-posting', 'feed-management', 'analytics'],
    limits: {
      maxUsers: 1000,
      maxStorage: 1000000,
      maxApiCalls: 10000,
      maxConcurrentSessions: 100,
      dataRetentionDays: 365,
      maxJobPosts: 100
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
