/**
 * @fileoverview Tenant Routes
 * Comprehensive tenant routes following the Hapi.js architecture pattern
 * 
 * @module
 */

import RoutesBuilder from './RoutesBuilder';
import { PageWorkflow, PluginWorkflow, ProxyWorkflow, CollectionWorkflowMediator, MetaWorkflow } from './Workflow';
import { WorkflowFn } from './RoutesBuilder';
import { Request, ResponseToolkit } from '@hapi/hapi';
import { TenantDatabaseContext } from '../types/tenant/TenantDatabaseTypes';

/**
 * TENANT ROUTES
 * Comprehensive tenant routes following the Hapi.js architecture pattern
 * 
 * Features:
 * - Workflow-based request handling
 * - Automatic tenant context injection
 * - Route configuration management
 * - Error handling and recovery
 * - Performance monitoring
 */
export class TenantRoutes {
  private routesBuilder: RoutesBuilder;

  constructor() {
    this.routesBuilder = new RoutesBuilder({
      timeout: {
        server: process.env.HAPI_SERVER_TIMEOUT || 30000
      }
    });

    this.setupRoutes();
  }

  /**
   * Setup all tenant routes
   */
  private setupRoutes(): void {
    // Health check routes
    this.routesBuilder
      .addRouteWithWorkflow('/health', this.healthCheckWorkflow)
      .addRouteWithWorkflow('/health/{tenantId}', this.tenantHealthCheckWorkflow);

    // Statistics routes
    this.routesBuilder
      .addRouteWithWorkflow('/stats', this.statsWorkflow)
      .addRouteWithWorkflow('/stats/{tenantId}', this.tenantStatsWorkflow);

    // Database management routes
    this.routesBuilder
      .addRouteWithWorkflow('/initialize/{tenantId}', this.initializeTenantWorkflow, 'POST')
      .addRouteWithWorkflow('/close/{tenantId}', this.closeTenantWorkflow, 'DELETE')
      .addRouteWithWorkflow('/drop/{tenantId}', this.dropTenantWorkflow, 'DELETE');

    // Configuration routes
    this.routesBuilder
      .addRouteWithWorkflow('/config/{tenantId}', this.tenantConfigWorkflow)
      .addRouteWithWorkflow('/limits/{tenantId}', this.tenantLimitsWorkflow)
      .addRouteWithWorkflow('/tenants', this.allTenantsWorkflow);

    // Cleanup routes
    this.routesBuilder
      .addRouteWithWorkflow('/cleanup/{tenantId}', this.cleanupTenantWorkflow, 'DELETE')
      .addRouteWithWorkflow('/cleanup', this.cleanupAllWorkflow, 'DELETE');

    // User management routes
    this.routesBuilder
      .addRouteWithWorkflow('/users', this.userListWorkflow)
      .addRouteWithWorkflow('/users/{userId}', this.userDetailWorkflow)
      .addRouteWithWorkflow('/users', this.userCreateWorkflow, 'POST')
      .addRouteWithWorkflow('/users/{userId}', this.userUpdateWorkflow, 'PUT')
      .addRouteWithWorkflow('/users/{userId}', this.userDeleteWorkflow, 'DELETE');

    // Poll management routes
    this.routesBuilder
      .addRouteWithWorkflow('/polls', this.pollListWorkflow)
      .addRouteWithWorkflow('/polls/{pollId}', this.pollDetailWorkflow)
      .addRouteWithWorkflow('/polls', this.pollCreateWorkflow, 'POST')
      .addRouteWithWorkflow('/polls/{pollId}', this.pollUpdateWorkflow, 'PUT')
      .addRouteWithWorkflow('/polls/{pollId}', this.pollDeleteWorkflow, 'DELETE');

    // Activity management routes
    this.routesBuilder
      .addRouteWithWorkflow('/activities', this.activityListWorkflow)
      .addRouteWithWorkflow('/activities/{activityId}', this.activityDetailWorkflow)
      .addRouteWithWorkflow('/activities', this.activityCreateWorkflow, 'POST');

    // Job management routes
    this.routesBuilder
      .addRouteWithWorkflow('/jobs', this.jobListWorkflow)
      .addRouteWithWorkflow('/jobs/{jobId}', this.jobDetailWorkflow)
      .addRouteWithWorkflow('/jobs', this.jobCreateWorkflow, 'POST')
      .addRouteWithWorkflow('/jobs/{jobId}', this.jobUpdateWorkflow, 'PUT')
      .addRouteWithWorkflow('/jobs/{jobId}', this.jobDeleteWorkflow, 'DELETE');

    // API routes
    this.routesBuilder
      .addRouteWithWorkflow('/api/users', this.userListWorkflow)
      .addRouteWithWorkflow('/api/users/{userId}', this.userDetailWorkflow)
      .addRouteWithWorkflow('/api/users', this.userCreateWorkflow, 'POST')
      .addRouteWithWorkflow('/api/users/{userId}', this.userUpdateWorkflow, 'PUT')
      .addRouteWithWorkflow('/api/users/{userId}', this.userDeleteWorkflow, 'DELETE')
      .addRouteWithWorkflow('/api/polls', this.pollListWorkflow)
      .addRouteWithWorkflow('/api/polls/{pollId}', this.pollDetailWorkflow)
      .addRouteWithWorkflow('/api/polls', this.pollCreateWorkflow, 'POST')
      .addRouteWithWorkflow('/api/polls/{pollId}', this.pollUpdateWorkflow, 'PUT')
      .addRouteWithWorkflow('/api/polls/{pollId}', this.pollDeleteWorkflow, 'DELETE')
      .addRouteWithWorkflow('/api/activities', this.activityListWorkflow)
      .addRouteWithWorkflow('/api/activities/{activityId}', this.activityDetailWorkflow)
      .addRouteWithWorkflow('/api/activities', this.activityCreateWorkflow, 'POST')
      .addRouteWithWorkflow('/api/jobs', this.jobListWorkflow)
      .addRouteWithWorkflow('/api/jobs/{jobId}', this.jobDetailWorkflow)
      .addRouteWithWorkflow('/api/jobs', this.jobCreateWorkflow, 'POST')
      .addRouteWithWorkflow('/api/jobs/{jobId}', this.jobUpdateWorkflow, 'PUT')
      .addRouteWithWorkflow('/api/jobs/{jobId}', this.jobDeleteWorkflow, 'DELETE');
  }

  /**
   * Health check workflow
   */
  private healthCheckWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { tenantDatabaseManager } = await import('../config/tenant/TenantDatabaseManager');
      const activeConnections = tenantDatabaseManager.getActiveConnections();
      const healthChecks = [];

      for (const connection of activeConnections) {
        const health = await tenantDatabaseManager.healthCheck(connection.tenantId);
        healthChecks.push({
          tenantId: connection.tenantId,
          databaseName: connection.databaseName,
          ...health
        });
      }

      return {
        success: true,
        data: {
          healthChecks,
          totalConnections: activeConnections.length
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
   * Tenant-specific health check workflow
   */
  private tenantHealthCheckWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { tenantDatabaseManager } = await import('../config/tenant/TenantDatabaseManager');
      const { tenantId } = request.params;
      const health = await tenantDatabaseManager.healthCheck(tenantId);

      return {
        success: true,
        data: { health },
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
   * Statistics workflow
   */
  private statsWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { tenantConfigSwitcher } = await import('../config/tenant/TenantConfigSwitcher');
      const statistics = await tenantConfigSwitcher.getTenantStatistics();

      return {
        success: true,
        data: { statistics },
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
   * Tenant-specific statistics workflow
   */
  private tenantStatsWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { tenantDatabaseManager } = await import('../config/tenant/TenantDatabaseManager');
      const { tenantId } = request.params;
      const stats = await tenantDatabaseManager.getTenantDatabaseStats(tenantId);

      return {
        success: true,
        data: { stats },
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
   * Initialize tenant workflow
   */
  private initializeTenantWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { tenantDatabaseManager } = await import('../config/tenant/TenantDatabaseManager');
      const { tenantId } = request.params;
      const result = await tenantDatabaseManager.initializeTenantDatabase(tenantId);

      if (result.success) {
        return {
          success: true,
          data: {
            message: `Tenant database initialized for ${tenantId}`,
            databaseName: tenantDatabaseManager.getTenantDatabaseName(tenantId)
          },
          statusCode: 201
        };
      } else {
        return {
          success: false,
          error: result.error,
          statusCode: 500
        };
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        statusCode: 500
      };
    }
  };

  /**
   * Close tenant workflow
   */
  private closeTenantWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { tenantDatabaseManager } = await import('../config/tenant/TenantDatabaseManager');
      const { tenantId } = request.params;
      const result = await tenantDatabaseManager.closeTenantConnection(tenantId);

      return {
        success: true,
        data: {
          message: `Tenant database connection closed for ${tenantId}`
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
   * Drop tenant workflow
   */
  private dropTenantWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { tenantDatabaseManager } = await import('../config/tenant/TenantDatabaseManager');
      const { tenantId } = request.params;
      const result = await tenantDatabaseManager.dropTenantDatabase(tenantId);

      return {
        success: true,
        data: {
          message: `Tenant database dropped for ${tenantId}`
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
   * Tenant configuration workflow
   */
  private tenantConfigWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { tenantConfigSwitcher } = await import('../config/tenant/TenantConfigSwitcher');
      const { tenantId } = request.params;
      const config = tenantConfigSwitcher.getTenantConfig(tenantId);

      if (!config) {
        return {
          success: false,
          error: 'Tenant configuration not found',
          statusCode: 404
        };
      }

      return {
        success: true,
        data: { config },
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
   * Tenant limits workflow
   */
  private tenantLimitsWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { tenantConfigSwitcher } = await import('../config/tenant/TenantConfigSwitcher');
      const { tenantId } = request.params;
      const limits = await tenantConfigSwitcher.checkTenantLimits(tenantId);

      return {
        success: true,
        data: { limits },
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
   * All tenants workflow
   */
  private allTenantsWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { tenantConfigSwitcher } = await import('../config/tenant/TenantConfigSwitcher');
      const tenants = tenantConfigSwitcher.getAllTenants();

      return {
        success: true,
        data: { tenants },
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
   * Cleanup tenant workflow
   */
  private cleanupTenantWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { tenantConfigSwitcher } = await import('../config/tenant/TenantConfigSwitcher');
      const { tenantId } = request.params;
      const result = await tenantConfigSwitcher.cleanupTenant(tenantId);

      return {
        success: true,
        data: {
          message: `Tenant resources cleaned up for ${tenantId}`
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
   * Cleanup all workflow
   */
  private cleanupAllWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { tenantConfigSwitcher } = await import('../config/tenant/TenantConfigSwitcher');
      const result = await tenantConfigSwitcher.cleanupAll();

      return {
        success: true,
        data: {
          message: 'All tenant resources cleaned up'
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
   * User list workflow
   */
  private userListWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { query } = request.query;
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
  private userDetailWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { userId } = request.params;
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
  private userCreateWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { payload } = request;
      const user = new tenantContext.models.User({
        ...payload,
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
  private userUpdateWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { userId } = request.params;
      const { payload } = request;

      const user = await tenantContext.models.User.findByIdAndUpdate(
        userId,
        payload,
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
  private userDeleteWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { userId } = request.params;
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
  private pollListWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { query } = request.query;
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
  private pollDetailWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { pollId } = request.params;
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
  private pollCreateWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { payload } = request;
      const poll = new tenantContext.models.Poll({
        ...payload,
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
  private pollUpdateWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { pollId } = request.params;
      const { payload } = request;

      const poll = await tenantContext.models.Poll.findByIdAndUpdate(
        pollId,
        payload,
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
  private pollDeleteWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { pollId } = request.params;
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
  private activityListWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { query } = request.query;
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
  private activityDetailWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { activityId } = request.params;
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
  private activityCreateWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { payload } = request;
      const activity = new tenantContext.models.Activity({
        ...payload,
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
  private jobListWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { query } = request.query;
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
  private jobDetailWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { jobId } = request.params;
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
  private jobCreateWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { payload } = request;
      const job = new tenantContext.models.Job({
        ...payload,
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
  private jobUpdateWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { jobId } = request.params;
      const { payload } = request;

      const job = await tenantContext.models.Job.findByIdAndUpdate(
        jobId,
        payload,
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
  private jobDeleteWorkflow: WorkflowFn = async (tenantContext: TenantDatabaseContext, request: Request, h: ResponseToolkit) => {
    try {
      const { jobId } = request.params;
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

  /**
   * Get the routes builder
   * 
   * @returns RoutesBuilder instance
   */
  public getRoutesBuilder(): RoutesBuilder {
    return this.routesBuilder;
  }

  /**
   * Build the routes
   * 
   * @returns Array of server routes
   */
  public build(): any[] {
    return this.routesBuilder.build();
  }
}

export default TenantRoutes;
