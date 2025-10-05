/**
 * LUXGEN JOB POST WORKFLOW
 * Business logic workflow for job post management
 */

import { BaseWorkflow } from '../Workflow';
import { WorkflowContext } from '../WorkflowContext';
import { WorkflowResult } from '../WorkflowResult';
import { WorkflowDefinition } from '../Workflow';

export class JobPostWorkflow extends BaseWorkflow {
  constructor() {
    const definition: WorkflowDefinition = {
      id: 'job-post-management',
      name: 'Job Post Management Workflow',
      version: '1.0.0',
      description: 'Handles job post creation, validation, and publishing with tenant isolation',
      steps: [
        {
          id: 'validate-job-data',
          name: 'Validate Job Post Data',
          type: 'validation',
          dependencies: [],
          timeout: 5000,
          retryable: true,
          critical: true,
          handler: this.validateJobData.bind(this)
        },
        {
          id: 'check-user-permissions',
          name: 'Check User Permissions',
          type: 'validation',
          dependencies: ['validate-job-data'],
          timeout: 5000,
          retryable: true,
          critical: true,
          handler: this.checkUserPermissions.bind(this)
        },
        {
          id: 'validate-tenant-limits',
          name: 'Validate Tenant Limits',
          type: 'validation',
          dependencies: ['check-user-permissions'],
          timeout: 5000,
          retryable: true,
          critical: true,
          handler: this.validateTenantLimits.bind(this)
        },
        {
          id: 'process-job-content',
          name: 'Process Job Content',
          type: 'business-logic',
          dependencies: ['validate-tenant-limits'],
          timeout: 10000,
          retryable: true,
          critical: true,
          handler: this.processJobContent.bind(this)
        },
        {
          id: 'save-job-post',
          name: 'Save Job Post',
          type: 'data-access',
          dependencies: ['process-job-content'],
          timeout: 15000,
          retryable: true,
          critical: true,
          handler: this.saveJobPost.bind(this)
        },
        {
          id: 'notify-stakeholders',
          name: 'Notify Stakeholders',
          type: 'notification',
          dependencies: ['save-job-post'],
          timeout: 10000,
          retryable: true,
          critical: false,
          handler: this.notifyStakeholders.bind(this)
        },
        {
          id: 'log-activity',
          name: 'Log Job Post Activity',
          type: 'notification',
          dependencies: ['save-job-post'],
          timeout: 5000,
          retryable: true,
          critical: false,
          handler: this.logActivity.bind(this)
        }
      ],
      triggers: [
        {
          type: 'api-call',
          conditions: { endpoint: '/api/v1/jobs' }
        }
      ],
      conditions: [
        {
          field: 'tenantId',
          operator: 'equals',
          value: 'required',
          required: true
        },
        {
          field: 'userRole',
          operator: 'equals',
          value: 'admin',
          required: true
        }
      ],
      errorHandling: {
        strategy: 'retry',
        maxRetries: 3,
        retryDelay: 2000,
        notifications: [
          {
            type: 'email',
            recipients: ['admin@luxgen.com'],
            template: 'job-post-error',
            conditions: { errorType: 'critical' }
          }
        ]
      },
      tenantSpecific: true,
      crossTenantAllowed: false
    };

    super(definition);
  }

  /**
   * Validate job post data
   */
  private async validateJobData(context: WorkflowContext): Promise<WorkflowResult> {
    try {
      const { title, description, company, location, salary, requirements } = context.data;

      // Check required fields
      if (!title || !description || !company || !location) {
        return {
          success: false,
          message: 'Missing required job post fields',
          errors: [{
            code: 'MISSING_FIELDS',
            message: 'Title, description, company, and location are required',
            retryable: false,
            timestamp: new Date()
          }],
          statusCode: 400
        };
      }

      // Validate title length
      if (title.length < 10 || title.length > 100) {
        return {
          success: false,
          message: 'Invalid job title length',
          errors: [{
            code: 'INVALID_TITLE_LENGTH',
            message: 'Job title must be between 10 and 100 characters',
            retryable: false,
            timestamp: new Date()
          }],
          statusCode: 400
        };
      }

      // Validate description length
      if (description.length < 50 || description.length > 2000) {
        return {
          success: false,
          message: 'Invalid job description length',
          errors: [{
            code: 'INVALID_DESCRIPTION_LENGTH',
            message: 'Job description must be between 50 and 2000 characters',
            retryable: false,
            timestamp: new Date()
          }],
          statusCode: 400
        };
      }

      // Validate salary range
      if (salary && (salary.min < 0 || salary.max < salary.min)) {
        return {
          success: false,
          message: 'Invalid salary range',
          errors: [{
            code: 'INVALID_SALARY_RANGE',
            message: 'Salary range is invalid',
            retryable: false,
            timestamp: new Date()
          }],
          statusCode: 400
        };
      }

      return {
        success: true,
        message: 'Job post data validation successful',
        data: { validated: true }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Job data validation failed',
        errors: [{
          code: 'VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
          timestamp: new Date()
        }],
        statusCode: 500
      };
    }
  }

  /**
   * Check user permissions
   */
  private async checkUserPermissions(context: WorkflowContext): Promise<WorkflowResult> {
    try {
      const { userRole, userPermissions } = context;

      // Check if user has admin or trainer role
      if (!['admin', 'super-admin', 'trainer'].includes(userRole || '')) {
        return {
          success: false,
          message: 'Insufficient permissions to create job posts',
          errors: [{
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Only admins, super-admins, and trainers can create job posts',
            retryable: false,
            timestamp: new Date()
          }],
          statusCode: 403
        };
      }

      // Check specific permissions
      if (!userPermissions.includes('job-post-create')) {
        return {
          success: false,
          message: 'Missing job post creation permission',
          errors: [{
            code: 'MISSING_PERMISSION',
            message: 'job-post-create permission is required',
            retryable: false,
            timestamp: new Date()
          }],
          statusCode: 403
        };
      }

      return {
        success: true,
        message: 'User permissions validated',
        data: { 
          userRole,
          permissions: userPermissions
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Permission check failed',
        errors: [{
          code: 'PERMISSION_CHECK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
          timestamp: new Date()
        }],
        statusCode: 500
      };
    }
  }

  /**
   * Validate tenant limits
   */
  private async validateTenantLimits(context: WorkflowContext): Promise<WorkflowResult> {
    try {
      const { tenantConfig } = context;
      const { maxApiCalls } = tenantConfig.limits;

      // Check API call limits
      const currentApiCalls = await this.getCurrentApiCalls(context.tenantId);
      
      if (currentApiCalls >= maxApiCalls) {
        return {
          success: false,
          message: 'Tenant API limit exceeded',
          errors: [{
            code: 'API_LIMIT_EXCEEDED',
            message: `Maximum ${maxApiCalls} API calls allowed for this tenant`,
            retryable: false,
            timestamp: new Date()
          }],
          statusCode: 429
        };
      }

      // Check job post limits
      const currentJobPosts = await this.getCurrentJobPosts(context.tenantId);
      const maxJobPosts = tenantConfig.limits.maxJobPosts || 100;
      
      if (currentJobPosts >= maxJobPosts) {
        return {
          success: false,
          message: 'Tenant job post limit exceeded',
          errors: [{
            code: 'JOB_POST_LIMIT_EXCEEDED',
            message: `Maximum ${maxJobPosts} job posts allowed for this tenant`,
            retryable: false,
            timestamp: new Date()
          }],
          statusCode: 429
        };
      }

      return {
        success: true,
        message: 'Tenant limits validation passed',
        data: { 
          currentApiCalls,
          maxApiCalls,
          currentJobPosts,
          maxJobPosts
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Tenant limits validation failed',
        errors: [{
          code: 'LIMITS_VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
          timestamp: new Date()
        }],
        statusCode: 500
      };
    }
  }

  /**
   * Process job content
   */
  private async processJobContent(context: WorkflowContext): Promise<WorkflowResult> {
    try {
      const { title, description, company, location, salary, requirements } = context.data;
      const { tenantId, tenantConfig } = context;

      // Process and sanitize content
      const processedContent = {
        title: this.sanitizeText(title),
        description: this.sanitizeText(description),
        company: {
          name: this.sanitizeText(company.name),
          logo: company.logo,
          website: company.website
        },
        location: {
          city: this.sanitizeText(location.city),
          country: this.sanitizeText(location.country),
          remote: location.remote || false
        },
        salary: salary ? {
          min: salary.min,
          max: salary.max,
          currency: salary.currency || 'USD',
          period: salary.period || 'yearly'
        } : null,
        requirements: requirements ? requirements.map(req => this.sanitizeText(req)) : [],
        tenantId,
        createdBy: context.userId,
        createdAt: new Date(),
        status: 'draft',
        tenantConfig: {
          features: tenantConfig.features,
          branding: tenantConfig.branding
        }
      };

      return {
        success: true,
        message: 'Job content processed successfully',
        data: processedContent
      };

    } catch (error) {
      return {
        success: false,
        message: 'Job content processing failed',
        errors: [{
          code: 'CONTENT_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
          timestamp: new Date()
        }],
        statusCode: 500
      };
    }
  }

  /**
   * Save job post
   */
  private async saveJobPost(context: WorkflowContext): Promise<WorkflowResult> {
    try {
      const processedContent = context.data;
      const { tenantId } = context;

      // Save to database
      const jobPost = await this.saveJobPostToDatabase(processedContent);

      return {
        success: true,
        message: 'Job post saved successfully',
        data: {
          jobId: jobPost.id,
          title: jobPost.title,
          status: jobPost.status,
          createdAt: jobPost.createdAt
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Job post saving failed',
        errors: [{
          code: 'SAVE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
          timestamp: new Date()
        }],
        statusCode: 500
      };
    }
  }

  /**
   * Notify stakeholders
   */
  private async notifyStakeholders(context: WorkflowContext): Promise<WorkflowResult> {
    try {
      const { jobId, title } = context.data;
      const { tenantId, userId } = context;

      // Notify HR team
      await this.notifyHRTeam(tenantId, {
        jobId,
        title,
        createdBy: userId
      });

      // Notify admin users
      await this.notifyAdminUsers(tenantId, {
        jobId,
        title,
        createdBy: userId
      });

      return {
        success: true,
        message: 'Stakeholders notified successfully',
        data: { notificationsSent: true }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Stakeholder notification failed',
        errors: [{
          code: 'NOTIFICATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
          timestamp: new Date()
        }],
        statusCode: 500
      };
    }
  }

  /**
   * Log activity
   */
  private async logActivity(context: WorkflowContext): Promise<WorkflowResult> {
    try {
      const { jobId, title } = context.data;
      const { tenantId, userId } = context;

      // Create audit log entry
      const auditEntry = {
        timestamp: new Date(),
        action: 'job_post_created',
        userId,
        tenantId,
        resource: 'job_post',
        details: {
          jobId,
          title,
          workflowId: context.workflowId
        },
        ipAddress: context.request.ip,
        userAgent: context.request.get('User-Agent')
      };

      // Add to audit trail
      context.auditTrail.push(auditEntry);

      return {
        success: true,
        message: 'Activity logged successfully',
        data: { auditEntry }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Activity logging failed',
        errors: [{
          code: 'LOGGING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
          timestamp: new Date()
        }],
        statusCode: 500
      };
    }
  }

  /**
   * Sanitize text content
   */
  private sanitizeText(text: string): string {
    return text
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .substring(0, 1000);
  }

  /**
   * Get current API calls for tenant
   */
  private async getCurrentApiCalls(tenantId: string): Promise<number> {
    // Simulate API call count
    return Math.floor(Math.random() * 100);
  }

  /**
   * Get current job posts for tenant
   */
  private async getCurrentJobPosts(tenantId: string): Promise<number> {
    // Simulate job post count
    return Math.floor(Math.random() * 50);
  }

  /**
   * Save job post to database
   */
  private async saveJobPostToDatabase(jobData: any): Promise<any> {
    // Simulate database save
    return {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...jobData,
      createdAt: new Date()
    };
  }

  /**
   * Notify HR team
   */
  private async notifyHRTeam(tenantId: string, data: any): Promise<void> {
    console.log(`Notifying HR team for tenant ${tenantId}:`, data);
  }

  /**
   * Notify admin users
   */
  private async notifyAdminUsers(tenantId: string, data: any): Promise<void> {
    console.log(`Notifying admin users for tenant ${tenantId}:`, data);
  }
}
