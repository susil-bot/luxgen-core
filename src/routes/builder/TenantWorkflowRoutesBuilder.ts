/**
 * @fileoverview Tenant Workflow Routes Builder
 * Workflow-based routes builder for tenant-specific operations
 * 
 * @module
 */

import { Request, Response, NextFunction } from 'express';
import { TenantRoutesBuilder, TenantRouteHandler } from './TenantRoutesBuilder';
import { TenantDatabaseContext } from '../../types/tenant/TenantDatabaseTypes';

/**
 * Workflow function type
 */
export type TenantWorkflowFn = (
  tenantContext: TenantDatabaseContext,
  requestData: any
) => Promise<any> | any;

/**
 * Workflow result interface
 */
export interface TenantWorkflowResult {
  success: boolean;
  data?: any;
  error?: string;
  statusCode: number;
  headers?: Record<string, string>;
}

/**
 * TENANT WORKFLOW ROUTES BUILDER
 * Workflow-based routes builder for tenant-specific operations
 * 
 * Features:
 * - Workflow-based request handling
 * - Automatic tenant context injection
 * - Request/response transformation
 * - Error handling and recovery
 * - Performance monitoring
 */
export class TenantWorkflowRoutesBuilder extends TenantRoutesBuilder {
  constructor() {
    super({
      timeout: 30000,
      cors: true,
      rateLimit: true,
      logging: true,
      errorHandling: true
    });

    this.setupWorkflowRoutes();
  }

  /**
   * Setup workflow-based routes
   */
  private setupWorkflowRoutes(): void {
    // User management workflows
    this.get('/users', this.createWorkflowHandler(this.userListWorkflow))
      .get('/users/:userId', this.createWorkflowHandler(this.userDetailWorkflow))
      .post('/users', this.createWorkflowHandler(this.userCreateWorkflow))
      .put('/users/:userId', this.createWorkflowHandler(this.userUpdateWorkflow))
      .delete('/users/:userId', this.createWorkflowHandler(this.userDeleteWorkflow));

    // Poll management workflows
    this.get('/polls', this.createWorkflowHandler(this.pollListWorkflow))
      .get('/polls/:pollId', this.createWorkflowHandler(this.pollDetailWorkflow))
      .post('/polls', this.createWorkflowHandler(this.pollCreateWorkflow))
      .put('/polls/:pollId', this.createWorkflowHandler(this.pollUpdateWorkflow))
      .delete('/polls/:pollId', this.createWorkflowHandler(this.pollDeleteWorkflow));

    // Activity management workflows
    this.get('/activities', this.createWorkflowHandler(this.activityListWorkflow))
      .get('/activities/:activityId', this.createWorkflowHandler(this.activityDetailWorkflow))
      .post('/activities', this.createWorkflowHandler(this.activityCreateWorkflow));

    // Job management workflows
    this.get('/jobs', this.createWorkflowHandler(this.jobListWorkflow))
      .get('/jobs/:jobId', this.createWorkflowHandler(this.jobDetailWorkflow))
      .post('/jobs', this.createWorkflowHandler(this.jobCreateWorkflow))
      .put('/jobs/:jobId', this.createWorkflowHandler(this.jobUpdateWorkflow))
      .delete('/jobs/:jobId', this.createWorkflowHandler(this.jobDeleteWorkflow));
  }

  /**
   * Create workflow handler
   * 
   * @param workflow - Workflow function
   * @returns Tenant route handler
   */
  private createWorkflowHandler(workflow: TenantWorkflowFn): TenantRouteHandler {
    return async (req, res, next, tenantContext) => {
      try {
        const requestData = {
          method: req.method,
          path: req.path,
          params: req.params,
          query: req.query,
          body: req.body,
          headers: req.headers,
          user: (req as any).user
        };

        const result = await workflow(tenantContext, requestData);
        
        if (result.success) {
          res.status(result.statusCode || 200).json({
            success: true,
            data: result.data,
            timestamp: new Date().toISOString()
          });
        } else {
          res.status(result.statusCode || 400).json({
            success: false,
            error: result.error,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('❌ Workflow error:', error);
        res.status(500).json({
          success: false,
          error: (error as Error).message,
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  /**
   * User list workflow
   */
  private userListWorkflow: TenantWorkflowFn = async (tenantContext, requestData) => {
    try {
      const { query } = requestData;
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 10;
      const skip = (page - 1) * limit;

      const users = await tenantContext.models.User.find({})
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await tenantContext.models.User.countDocuments({});

      return {
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        },
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        statusCode: 500
      };
    }
  };

  /**
   * User detail workflow
   */
  private userDetailWorkflow: TenantWorkflowFn = async (tenantContext, requestData) => {
    try {
      const { userId } = requestData.params;
      const user = await tenantContext.models.User.findById(userId);

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          statusCode: 404
        };
      }

      return {
        success: true,
        data: { user },
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        statusCode: 500
      };
    }
  };

  /**
   * User create workflow
   */
  private userCreateWorkflow: TenantWorkflowFn = async (tenantContext, requestData) => {
    try {
      const { body } = requestData;
      const user = new tenantContext.models.User({
        ...body,
        tenantId: tenantContext.tenantId
      });

      await user.save();

      return {
        success: true,
        data: { user },
        statusCode: 201
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        statusCode: 400
      };
    }
  };

  /**
   * User update workflow
   */
  private userUpdateWorkflow: TenantWorkflowFn = async (tenantContext, requestData) => {
    try {
      const { userId } = requestData.params;
      const { body } = requestData;

      const user = await tenantContext.models.User.findByIdAndUpdate(
        userId,
        body,
        { new: true, runValidators: true }
      );

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          statusCode: 404
        };
      }

      return {
        success: true,
        data: { user },
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        statusCode: 400
      };
    }
  };

  /**
   * User delete workflow
   */
  private userDeleteWorkflow: TenantWorkflowFn = async (tenantContext, requestData) => {
    try {
      const { userId } = requestData.params;
      const user = await tenantContext.models.User.findByIdAndDelete(userId);

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          statusCode: 404
        };
      }

      return {
        success: true,
        data: { message: 'User deleted successfully' },
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        statusCode: 500
      };
    }
  };

  /**
   * Poll list workflow
   */
  private pollListWorkflow: TenantWorkflowFn = async (tenantContext, requestData) => {
    try {
      const { query } = requestData;
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 10;
      const skip = (page - 1) * limit;

      const polls = await tenantContext.models.Poll.find({})
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('createdBy', 'firstName lastName email');

      const total = await tenantContext.models.Poll.countDocuments({});

      return {
        success: true,
        data: {
          polls,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        },
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        statusCode: 500
      };
    }
  };

  /**
   * Poll detail workflow
   */
  private pollDetailWorkflow: TenantWorkflowFn = async (tenantContext, requestData) => {
    try {
      const { pollId } = requestData.params;
      const poll = await tenantContext.models.Poll.findById(pollId)
        .populate('createdBy', 'firstName lastName email');

      if (!poll) {
        return {
          success: false,
          error: 'Poll not found',
          statusCode: 404
        };
      }

      return {
        success: true,
        data: { poll },
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        statusCode: 500
      };
    }
  };

  /**
   * Poll create workflow
   */
  private pollCreateWorkflow: TenantWorkflowFn = async (tenantContext, requestData) => {
    try {
      const { body } = requestData;
      const poll = new tenantContext.models.Poll({
        ...body,
        tenantId: tenantContext.tenantId
      });

      await poll.save();

      return {
        success: true,
        data: { poll },
        statusCode: 201
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        statusCode: 400
      };
    }
  };

  /**
   * Poll update workflow
   */
  private pollUpdateWorkflow: TenantWorkflowFn = async (tenantContext, requestData) => {
    try {
      const { pollId } = requestData.params;
      const { body } = requestData;

      const poll = await tenantContext.models.Poll.findByIdAndUpdate(
        pollId,
        body,
        { new: true, runValidators: true }
      );

      if (!poll) {
        return {
          success: false,
          error: 'Poll not found',
          statusCode: 404
        };
      }

      return {
        success: true,
        data: { poll },
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        statusCode: 400
      };
    }
  };

  /**
   * Poll delete workflow
   */
  private pollDeleteWorkflow: TenantWorkflowFn = async (tenantContext, requestData) => {
    try {
      const { pollId } = requestData.params;
      const poll = await tenantContext.models.Poll.findByIdAndDelete(pollId);

      if (!poll) {
        return {
          success: false,
          error: 'Poll not found',
          statusCode: 404
        };
      }

      return {
        success: true,
        data: { message: 'Poll deleted successfully' },
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        statusCode: 500
      };
    }
  };

  /**
   * Activity list workflow
   */
  private activityListWorkflow: TenantWorkflowFn = async (tenantContext, requestData) => {
    try {
      const { query } = requestData;
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 10;
      const skip = (page - 1) * limit;

      const activities = await tenantContext.models.Activity.find({})
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('userId', 'firstName lastName email');

      const total = await tenantContext.models.Activity.countDocuments({});

      return {
        success: true,
        data: {
          activities,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        },
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        statusCode: 500
      };
    }
  };

  /**
   * Activity detail workflow
   */
  private activityDetailWorkflow: TenantWorkflowFn = async (tenantContext, requestData) => {
    try {
      const { activityId } = requestData.params;
      const activity = await tenantContext.models.Activity.findById(activityId)
        .populate('userId', 'firstName lastName email');

      if (!activity) {
        return {
          success: false,
          error: 'Activity not found',
          statusCode: 404
        };
      }

      return {
        success: true,
        data: { activity },
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        statusCode: 500
      };
    }
  };

  /**
   * Activity create workflow
   */
  private activityCreateWorkflow: TenantWorkflowFn = async (tenantContext, requestData) => {
    try {
      const { body } = requestData;
      const activity = new tenantContext.models.Activity({
        ...body,
        tenantId: tenantContext.tenantId
      });

      await activity.save();

      return {
        success: true,
        data: { activity },
        statusCode: 201
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        statusCode: 400
      };
    }
  };

  /**
   * Job list workflow
   */
  private jobListWorkflow: TenantWorkflowFn = async (tenantContext, requestData) => {
    try {
      const { query } = requestData;
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 10;
      const skip = (page - 1) * limit;

      const jobs = await tenantContext.models.Job.find({})
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('createdBy', 'firstName lastName email');

      const total = await tenantContext.models.Job.countDocuments({});

      return {
        success: true,
        data: {
          jobs,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        },
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        statusCode: 500
      };
    }
  };

  /**
   * Job detail workflow
   */
  private jobDetailWorkflow: TenantWorkflowFn = async (tenantContext, requestData) => {
    try {
      const { jobId } = requestData.params;
      const job = await tenantContext.models.Job.findById(jobId)
        .populate('createdBy', 'firstName lastName email');

      if (!job) {
        return {
          success: false,
          error: 'Job not found',
          statusCode: 404
        };
      }

      return {
        success: true,
        data: { job },
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        statusCode: 500
      };
    }
  };

  /**
   * Job create workflow
   */
  private jobCreateWorkflow: TenantWorkflowFn = async (tenantContext, requestData) => {
    try {
      const { body } = requestData;
      const job = new tenantContext.models.Job({
        ...body,
        tenantId: tenantContext.tenantId
      });

      await job.save();

      return {
        success: true,
        data: { job },
        statusCode: 201
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        statusCode: 400
      };
    }
  };

  /**
   * Job update workflow
   */
  private jobUpdateWorkflow: TenantWorkflowFn = async (tenantContext, requestData) => {
    try {
      const { jobId } = requestData.params;
      const { body } = requestData;

      const job = await tenantContext.models.Job.findByIdAndUpdate(
        jobId,
        body,
        { new: true, runValidators: true }
      );

      if (!job) {
        return {
          success: false,
          error: 'Job not found',
          statusCode: 404
        };
      }

      return {
        success: true,
        data: { job },
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        statusCode: 400
      };
    }
  };

  /**
   * Job delete workflow
   */
  private jobDeleteWorkflow: TenantWorkflowFn = async (tenantContext, requestData) => {
    try {
      const { jobId } = requestData.params;
      const job = await tenantContext.models.Job.findByIdAndDelete(jobId);

      if (!job) {
        return {
          success: false,
          error: 'Job not found',
          statusCode: 404
        };
      }

      return {
        success: true,
        data: { message: 'Job deleted successfully' },
        statusCode: 200
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        statusCode: 500
      };
    }
  };
}

export default TenantWorkflowRoutesBuilder;
