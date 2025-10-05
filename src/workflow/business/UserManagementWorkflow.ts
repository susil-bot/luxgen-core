/**
 * LUXGEN USER MANAGEMENT WORKFLOW
 * Business logic workflow for user management operations
 */

import { BaseWorkflow } from '../Workflow';
import { WorkflowContext } from '../WorkflowContext';
import { WorkflowResult } from '../WorkflowResult';
import { WorkflowDefinition } from '../Workflow';

export class UserManagementWorkflow extends BaseWorkflow {
  constructor() {
    const definition: WorkflowDefinition = {
      id: 'user-management',
      name: 'User Management Workflow',
      version: '1.0.0',
      description: 'Handles user creation, updates, and management with tenant isolation',
      steps: [
        {
          id: 'validate-user-data',
          name: 'Validate User Data',
          type: 'validation',
          dependencies: [],
          timeout: 5000,
          retryable: true,
          critical: true,
          handler: this.validateUserData.bind(this)
        },
        {
          id: 'check-admin-permissions',
          name: 'Check Admin Permissions',
          type: 'validation',
          dependencies: ['validate-user-data'],
          timeout: 5000,
          retryable: true,
          critical: true,
          handler: this.checkAdminPermissions.bind(this)
        },
        {
          id: 'validate-tenant-capacity',
          name: 'Validate Tenant Capacity',
          type: 'validation',
          dependencies: ['check-admin-permissions'],
          timeout: 5000,
          retryable: true,
          critical: true,
          handler: this.validateTenantCapacity.bind(this)
        },
        {
          id: 'process-user-profile',
          name: 'Process User Profile',
          type: 'business-logic',
          dependencies: ['validate-tenant-capacity'],
          timeout: 10000,
          retryable: true,
          critical: true,
          handler: this.processUserProfile.bind(this)
        },
        {
          id: 'create-user-account',
          name: 'Create User Account',
          type: 'data-access',
          dependencies: ['process-user-profile'],
          timeout: 15000,
          retryable: true,
          critical: true,
          handler: this.createUserAccount.bind(this)
        },
        {
          id: 'assign-user-role',
          name: 'Assign User Role',
          type: 'business-logic',
          dependencies: ['create-user-account'],
          timeout: 10000,
          retryable: true,
          critical: true,
          handler: this.assignUserRole.bind(this)
        },
        {
          id: 'send-welcome-notification',
          name: 'Send Welcome Notification',
          type: 'notification',
          dependencies: ['assign-user-role'],
          timeout: 10000,
          retryable: true,
          critical: false,
          handler: this.sendWelcomeNotification.bind(this)
        },
        {
          id: 'log-user-creation',
          name: 'Log User Creation',
          type: 'notification',
          dependencies: ['create-user-account'],
          timeout: 5000,
          retryable: true,
          critical: false,
          handler: this.logUserCreation.bind(this)
        }
      ],
      triggers: [
        {
          type: 'api-call',
          conditions: { endpoint: '/api/v1/users' }
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
            template: 'user-creation-error',
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
   * Validate user data
   */
  private async validateUserData(context: WorkflowContext): Promise<WorkflowResult> {
    try {
      const { firstName, lastName, email, role, department } = context.data;

      // Check required fields
      if (!firstName || !lastName || !email || !role) {
        return {
          success: false,
          message: 'Missing required user fields',
          errors: [{
            code: 'MISSING_FIELDS',
            message: 'First name, last name, email, and role are required',
            retryable: false,
            timestamp: new Date()
          }],
          statusCode: 400
        };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          message: 'Invalid email format',
          errors: [{
            code: 'INVALID_EMAIL',
            message: 'Email format is invalid',
            retryable: false,
            timestamp: new Date()
          }],
          statusCode: 400
        };
      }

      // Validate role
      const validRoles = ['user', 'admin', 'trainer', 'hr'];
      if (!validRoles.includes(role)) {
        return {
          success: false,
          message: 'Invalid user role',
          errors: [{
            code: 'INVALID_ROLE',
            message: `Role must be one of: ${validRoles.join(', ')}`,
            retryable: false,
            timestamp: new Date()
          }],
          statusCode: 400
        };
      }

      // Check if email already exists
      const emailExists = await this.checkEmailExists(email, context.tenantId);
      if (emailExists) {
        return {
          success: false,
          message: 'Email already exists',
          errors: [{
            code: 'EMAIL_EXISTS',
            message: 'A user with this email already exists',
            retryable: false,
            timestamp: new Date()
          }],
          statusCode: 409
        };
      }

      return {
        success: true,
        message: 'User data validation successful',
        data: { validated: true }
      };

    } catch (error) {
      return {
        success: false,
        message: 'User data validation failed',
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
   * Check admin permissions
   */
  private async checkAdminPermissions(context: WorkflowContext): Promise<WorkflowResult> {
    try {
      const { userRole, userPermissions } = context;
      const { role } = context.data;

      // Check if current user is admin
      if (!['admin', 'super-admin'].includes(userRole || '')) {
        return {
          success: false,
          message: 'Insufficient permissions to create users',
          errors: [{
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Only admins can create users',
            retryable: false,
            timestamp: new Date()
          }],
          statusCode: 403
        };
      }

      // Check if trying to create super-admin
      if (role === 'super-admin' && userRole !== 'super-admin') {
        return {
          success: false,
          message: 'Cannot create super-admin user',
          errors: [{
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Only super-admins can create super-admin users',
            retryable: false,
            timestamp: new Date()
          }],
          statusCode: 403
        };
      }

      // Check specific permissions
      if (!userPermissions.includes('user-create')) {
        return {
          success: false,
          message: 'Missing user creation permission',
          errors: [{
            code: 'MISSING_PERMISSION',
            message: 'user-create permission is required',
            retryable: false,
            timestamp: new Date()
          }],
          statusCode: 403
        };
      }

      return {
        success: true,
        message: 'Admin permissions validated',
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
   * Validate tenant capacity
   */
  private async validateTenantCapacity(context: WorkflowContext): Promise<WorkflowResult> {
    try {
      const { tenantConfig } = context;
      const { maxUsers } = tenantConfig.limits;

      // Get current user count
      const currentUserCount = await this.getCurrentUserCount(context.tenantId);
      
      if (currentUserCount >= maxUsers) {
        return {
          success: false,
          message: 'Tenant user limit exceeded',
          errors: [{
            code: 'USER_LIMIT_EXCEEDED',
            message: `Maximum ${maxUsers} users allowed for this tenant`,
            retryable: false,
            timestamp: new Date()
          }],
          statusCode: 429
        };
      }

      return {
        success: true,
        message: 'Tenant capacity validation passed',
        data: { 
          currentUsers: currentUserCount,
          maxUsers,
          remaining: maxUsers - currentUserCount
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Tenant capacity validation failed',
        errors: [{
          code: 'CAPACITY_VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
          timestamp: new Date()
        }],
        statusCode: 500
      };
    }
  }

  /**
   * Process user profile
   */
  private async processUserProfile(context: WorkflowContext): Promise<WorkflowResult> {
    try {
      const { firstName, lastName, email, role, department, phone, avatar } = context.data;
      const { tenantId, tenantConfig } = context;

      // Process and sanitize user data
      const processedProfile = {
        firstName: this.sanitizeText(firstName),
        lastName: this.sanitizeText(lastName),
        email: email.toLowerCase().trim(),
        role,
        department: department ? this.sanitizeText(department) : null,
        phone: phone ? this.sanitizeText(phone) : null,
        avatar: avatar || null,
        tenantId,
        createdBy: context.userId,
        createdAt: new Date(),
        isActive: true,
        isVerified: false,
        lastLogin: null,
        tenantConfig: {
          features: tenantConfig.features,
          limits: tenantConfig.limits
        }
      };

      return {
        success: true,
        message: 'User profile processed successfully',
        data: processedProfile
      };

    } catch (error) {
      return {
        success: false,
        message: 'User profile processing failed',
        errors: [{
          code: 'PROFILE_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
          timestamp: new Date()
        }],
        statusCode: 500
      };
    }
  }

  /**
   * Create user account
   */
  private async createUserAccount(context: WorkflowContext): Promise<WorkflowResult> {
    try {
      const processedProfile = context.data;
      const { tenantId } = context;

      // Generate temporary password
      const temporaryPassword = this.generateTemporaryPassword();

      // Create user account
      const userAccount = {
        ...processedProfile,
        password: await this.hashPassword(temporaryPassword),
        temporaryPassword: true,
        passwordResetRequired: true
      };

      // Save to database
      const user = await this.saveUserToDatabase(userAccount);

      return {
        success: true,
        message: 'User account created successfully',
        data: {
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          temporaryPassword,
          createdAt: user.createdAt
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'User account creation failed',
        errors: [{
          code: 'ACCOUNT_CREATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
          timestamp: new Date()
        }],
        statusCode: 500
      };
    }
  }

  /**
   * Assign user role
   */
  private async assignUserRole(context: WorkflowContext): Promise<WorkflowResult> {
    try {
      const { userId, role } = context.data;
      const { tenantId } = context;

      // Assign role permissions
      const permissions = this.getRolePermissions(role);
      
      // Update user permissions
      await this.updateUserPermissions(userId, permissions);

      return {
        success: true,
        message: 'User role assigned successfully',
        data: {
          userId,
          role,
          permissions
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'User role assignment failed',
        errors: [{
          code: 'ROLE_ASSIGNMENT_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
          timestamp: new Date()
        }],
        statusCode: 500
      };
    }
  }

  /**
   * Send welcome notification
   */
  private async sendWelcomeNotification(context: WorkflowContext): Promise<WorkflowResult> {
    try {
      const { userId, email, firstName, temporaryPassword } = context.data;
      const { tenantConfig } = context;

      // Prepare welcome email
      const emailData = {
        to: email,
        subject: `Welcome to ${tenantConfig.name}!`,
        template: 'user-welcome',
        data: {
          firstName,
          tenantName: tenantConfig.name,
          loginUrl: `${tenantConfig.domain || 'https://luxgen.com'}/login`,
          temporaryPassword,
          passwordResetUrl: `${tenantConfig.domain || 'https://luxgen.com'}/reset-password`
        }
      };

      // Send welcome email
      await this.sendEmail(emailData);

      return {
        success: true,
        message: 'Welcome notification sent successfully',
        data: { emailSent: true }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Welcome notification failed',
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
   * Log user creation
   */
  private async logUserCreation(context: WorkflowContext): Promise<WorkflowResult> {
    try {
      const { userId, email, firstName, lastName, role } = context.data;
      const { tenantId, userId: createdBy } = context;

      // Create audit log entry
      const auditEntry = {
        timestamp: new Date(),
        action: 'user_created',
        userId: createdBy,
        tenantId,
        resource: 'user',
        details: {
          newUserId: userId,
          email,
          firstName,
          lastName,
          role,
          workflowId: context.workflowId
        },
        ipAddress: context.request.ip,
        userAgent: context.request.get('User-Agent')
      };

      // Add to audit trail
      context.auditTrail.push(auditEntry);

      return {
        success: true,
        message: 'User creation logged successfully',
        data: { auditEntry }
      };

    } catch (error) {
      return {
        success: false,
        message: 'User creation logging failed',
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
      .substring(0, 255);
  }

  /**
   * Check if email exists
   */
  private async checkEmailExists(email: string, tenantId: string): Promise<boolean> {
    // Simulate email check
    return Math.random() < 0.1; // 10% chance of existing
  }

  /**
   * Get current user count for tenant
   */
  private async getCurrentUserCount(tenantId: string): Promise<number> {
    // Simulate user count
    return Math.floor(Math.random() * 50);
  }

  /**
   * Generate temporary password
   */
  private generateTemporaryPassword(): string {
    return `temp_${Math.random().toString(36).substr(2, 8)}`;
  }

  /**
   * Hash password
   */
  private async hashPassword(password: string): Promise<string> {
    // Simulate password hashing
    return `hashed_${password}`;
  }

  /**
   * Save user to database
   */
  private async saveUserToDatabase(userData: any): Promise<any> {
    // Simulate database save
    return {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...userData,
      createdAt: new Date()
    };
  }

  /**
   * Get role permissions
   */
  private getRolePermissions(role: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      'user': ['read-profile', 'update-profile'],
      'admin': ['read-profile', 'update-profile', 'user-create', 'user-manage', 'job-post-create'],
      'trainer': ['read-profile', 'update-profile', 'job-post-create', 'training-manage'],
      'hr': ['read-profile', 'update-profile', 'user-manage', 'job-post-create']
    };

    return rolePermissions[role] || [];
  }

  /**
   * Update user permissions
   */
  private async updateUserPermissions(userId: string, permissions: string[]): Promise<void> {
    // Simulate permission update
    console.log(`Updating permissions for user ${userId}:`, permissions);
  }

  /**
   * Send email
   */
  private async sendEmail(emailData: any): Promise<void> {
    // Simulate email sending
    console.log('Sending email:', emailData);
  }
}
