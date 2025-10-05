/**
 * @fileoverview Hapi.js Server
 * Main Hapi.js server following the exact architecture pattern from the example
 * 
 * @module
 */

import Hapi from '@hapi/hapi';
import Joi from '@hapi/joi';
import { TenantRoutes } from './tenantRoutes';
import { RoutesBuilder } from './RoutesBuilder';
import { PageWorkflow, PluginWorkflow, ProxyWorkflow, CollectionWorkflowMediator, MetaWorkflow } from './Workflow';
import { WorkflowFn } from './RoutesBuilder';
import Tenant from './Tenant';

/**
 * Start Route Definitions
 */
const routesBuilder = new RoutesBuilder();

/**
 * Tenant-specific routes following the exact pattern from the example
 */
const tenantRoutes = new TenantRoutes();

// Health check routes
routesBuilder
  .addRouteWithWorkflow('/health', async (tenantContext, request, h) => {
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
  })
  .addRouteWithWorkflow('/health/{tenantId}', async (tenantContext, request, h) => {
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
  });

// Statistics routes
routesBuilder
  .addRouteWithWorkflow('/stats', async (tenantContext, request, h) => {
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
  })
  .addRouteWithWorkflow('/stats/{tenantId}', async (tenantContext, request, h) => {
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
  });

// Database management routes
routesBuilder
  .addRouteWithWorkflow('/initialize/{tenantId}', async (tenantContext, request, h) => {
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
  }, 'POST')
  .addRouteWithWorkflow('/close/{tenantId}', async (tenantContext, request, h) => {
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
  }, 'DELETE')
  .addRouteWithWorkflow('/drop/{tenantId}', async (tenantContext, request, h) => {
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
  }, 'DELETE');

// Configuration routes
routesBuilder
  .addRouteWithWorkflow('/config/{tenantId}', async (tenantContext, request, h) => {
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
  })
  .addRouteWithWorkflow('/limits/{tenantId}', async (tenantContext, request, h) => {
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
  })
  .addRouteWithWorkflow('/tenants', async (tenantContext, request, h) => {
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
  });

// Cleanup routes
routesBuilder
  .addRouteWithWorkflow('/cleanup/{tenantId}', async (tenantContext, request, h) => {
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
  }, 'DELETE')
  .addRouteWithWorkflow('/cleanup', async (tenantContext, request, h) => {
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
  }, 'DELETE');

// User management routes
routesBuilder
  .addRouteWithWorkflow('/users', async (tenantContext, request, h) => {
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
  })
  .addRouteWithWorkflow('/users/{userId}', async (tenantContext, request, h) => {
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
  })
  .addRouteWithWorkflow('/users', async (tenantContext, request, h) => {
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
  }, 'POST')
  .addRouteWithWorkflow('/users/{userId}', async (tenantContext, request, h) => {
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
  }, 'PUT')
  .addRouteWithWorkflow('/users/{userId}', async (tenantContext, request, h) => {
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
  }, 'DELETE');

// Poll management routes
routesBuilder
  .addRouteWithWorkflow('/polls', async (tenantContext, request, h) => {
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
  })
  .addRouteWithWorkflow('/polls/{pollId}', async (tenantContext, request, h) => {
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
  })
  .addRouteWithWorkflow('/polls', async (tenantContext, request, h) => {
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
  }, 'POST')
  .addRouteWithWorkflow('/polls/{pollId}', async (tenantContext, request, h) => {
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
  }, 'PUT')
  .addRouteWithWorkflow('/polls/{pollId}', async (tenantContext, request, h) => {
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
  }, 'DELETE');

// Activity management routes
routesBuilder
  .addRouteWithWorkflow('/activities', async (tenantContext, request, h) => {
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
  })
  .addRouteWithWorkflow('/activities/{activityId}', async (tenantContext, request, h) => {
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
  })
  .addRouteWithWorkflow('/activities', async (tenantContext, request, h) => {
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
  }, 'POST');

// Job management routes
routesBuilder
  .addRouteWithWorkflow('/jobs', async (tenantContext, request, h) => {
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
  })
  .addRouteWithWorkflow('/jobs/{jobId}', async (tenantContext, request, h) => {
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
  })
  .addRouteWithWorkflow('/jobs', async (tenantContext, request, h) => {
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
  }, 'POST')
  .addRouteWithWorkflow('/jobs/{jobId}', async (tenantContext, request, h) => {
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
  }, 'PUT')
  .addRouteWithWorkflow('/jobs/{jobId}', async (tenantContext, request, h) => {
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
  }, 'DELETE');

// API routes
routesBuilder
  .addRouteWithWorkflow('/api/users', async (tenantContext, request, h) => {
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
  })
  .addRouteWithWorkflow('/api/users/{userId}', async (tenantContext, request, h) => {
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
  })
  .addRouteWithWorkflow('/api/users', async (tenantContext, request, h) => {
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
  }, 'POST')
  .addRouteWithWorkflow('/api/users/{userId}', async (tenantContext, request, h) => {
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
  }, 'PUT')
  .addRouteWithWorkflow('/api/users/{userId}', async (tenantContext, request, h) => {
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
  }, 'DELETE');

// Client assets (JS, CSS, etc.)
routesBuilder.route({
  method: 'GET',
  path: '/static/{asset*}',
  handler: {
    directory: {
      path: 'build/static'
    }
  }
});

// Health check endpoint
routesBuilder.route({
  method: 'GET',
  path: '/ping',
  handler: () => {
    return { message: 'pong' };
  }
});

/**
 * The hidden config route.
 *
 * These can not be accessed by the normal domain.
 *
 * You must use `http://localhost:7777/config/` for this.
 *
 * This is a non normal route which doesn't start with the tenant slug,
 * therefore it is not available on the public sites.
 */
routesBuilder.route({
  method: 'GET',
  path: '/config/{tenantSlug}',
  handler: routesBuilder.provideUniversalHandler(async (tenantContext, request, h) => {
    return {
      success: true,
      data: {
        tenantId: tenantContext.tenantId,
        tenantSlug: tenantContext.tenantSlug,
        databaseName: tenantContext.databaseName,
        config: tenantContext.config
      },
      statusCode: 200
    };
  })
});

/**
 * The public config route.
 *
 * Can be accessed by providing a valid Bearer token
 */
routesBuilder.route({
  method: 'GET',
  path: '/{tenantSlug}/config',
  handler: routesBuilder.provideUniversalHandler(async (tenantContext, request, h) => {
    return {
      success: true,
      data: {
        tenantId: tenantContext.tenantId,
        tenantSlug: tenantContext.tenantSlug,
        databaseName: tenantContext.databaseName,
        config: tenantContext.config
      },
      statusCode: 200
    };
  })
});

/**
 * Create and start Hapi server
 */
async function createServer(): Promise<Hapi.Server> {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    routes: {
      cors: {
        origin: ['*'],
        credentials: true
      }
    }
  });

  // Register plugins
  await server.register([
    {
      plugin: require('@hapi/inert')
    },
    {
      plugin: require('@hapi/vision')
    }
  ]);

  // Add routes
  server.route(routesBuilder.build());

  return server;
}

/**
 * Start the server
 */
async function start(): Promise<void> {
  try {
    const server = await createServer();
    await server.start();
    console.log(`🚀 Hapi.js server running at: ${server.info.uri}`);
    console.log(`📊 Tenant routes available at: /{tenantSlug}/...`);
    console.log(`🔍 Health check available at: /ping`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if called directly
if (require.main === module) {
  start();
}

export default createServer;
