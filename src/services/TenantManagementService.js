/**
 * LUXGEN TENANT MANAGEMENT SERVICE
 * Comprehensive multi-tenant management system
 * 
 * Features:
 * - Tenant creation and management
 * - Brand identity management
 * - Feature flag management
 * - Usage tracking and analytics
 * - Security and isolation
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import models
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Job = require('../models/Job');

class TenantManagementService {
  constructor() {
    this.tenantCache = new Map();
    this.brandCache = new Map();
  }

  /**
   * CREATE NEW TENANT
   * Creates a new tenant with complete configuration
   */
  async createTenant(tenantData) {
    try {
      console.log('🏢 Creating new tenant:', tenantData.name);

      // Generate unique tenant ID
      const tenantId = new mongoose.Types.ObjectId();
      const slug = this.generateSlug(tenantData.name);

      // Create tenant configuration
      const tenantConfig = {
        _id: tenantId,
        name: tenantData.name,
        slug: slug,
        domain: tenantData.domain || null,
        description: tenantData.description || '',
        status: 'active',
        plan: tenantData.plan || 'starter',
        
        // Contact information
        contact: {
          email: tenantData.contactEmail,
          phone: tenantData.phone || '',
          website: tenantData.website || ''
        },

        // Business information
        business: {
          industry: tenantData.industry || '',
          companySize: tenantData.companySize || '1-10',
          foundedYear: tenantData.foundedYear || new Date().getFullYear()
        },

        // Subscription configuration
        subscription: {
          plan: tenantData.plan || 'starter',
          status: 'active',
          expiresAt: this.calculateExpirationDate(tenantData.plan),
          billingCycle: 'monthly'
        },

        // Usage limits based on plan
        limits: this.getPlanLimits(tenantData.plan),
        usage: {
          currentUsers: 0,
          currentStorageGB: 0,
          currentPolls: 0,
          apiCallsThisMonth: 0
        },

        // Feature flags
        features: this.getPlanFeatures(tenantData.plan),

        // Branding configuration
        branding: {
          logo: tenantData.logo || '/branding/default/logo.svg',
          primaryColor: tenantData.primaryColor || '#3B82F6',
          secondaryColor: tenantData.secondaryColor || '#1E40AF',
          accentColor: tenantData.accentColor || '#10B981',
          customCSS: '',
          customJS: '',
          theme: 'light'
        },

        // Security settings
        security: {
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: false
          },
          loginPolicy: {
            maxFailedAttempts: 5,
            lockoutDuration: 15,
            requireMFA: false
          }
        },

        // Settings
        settings: {
          timezone: tenantData.timezone || 'UTC',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          language: 'en',
          defaultUserRole: 'user',
          requireEmailVerification: true,
          allowUserRegistration: true,
          sessionTimeout: 24
        },

        // Metadata
        metadata: {
          createdAt: new Date(),
          createdBy: tenantData.createdBy || 'system',
          version: '1.0.0',
          tags: tenantData.tags || []
        }
      };

      // Create tenant in database
      const tenant = new Tenant(tenantConfig);
      await tenant.save();

      // Create default admin user
      await this.createDefaultAdmin(tenantId, tenantData);

      // Initialize tenant branding
      await this.initializeTenantBranding(tenantId, tenantConfig.branding);

      // Cache tenant configuration
      this.tenantCache.set(tenantId, tenantConfig);

      console.log('✅ Tenant created successfully:', tenantId);
      return {
        success: true,
        tenant: tenantConfig,
        message: 'Tenant created successfully'
      };

    } catch (error) {
      console.error('❌ Error creating tenant:', error);
      throw new Error(`Failed to create tenant: ${error.message}`);
    }
  }

  /**
   * GET TENANT BY ID OR SLUG
   */
  async getTenant(identifier) {
    try {
      // Check cache first
      if (this.tenantCache.has(identifier)) {
        return this.tenantCache.get(identifier);
      }

      // Build query conditions
      const queryConditions = [
        { slug: identifier },
        { domain: identifier }
      ];

      // Only add _id condition if identifier looks like a valid ObjectId
      if (identifier && typeof identifier === 'string' && identifier.length === 24 && /^[0-9a-fA-F]{24}$/.test(identifier)) {
        queryConditions.unshift({ _id: identifier });
      }

      // Query database
      const tenant = await Tenant.findOne({
        $or: queryConditions,
        isActive: true,
        isDeleted: false
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Cache tenant
      this.tenantCache.set(identifier, tenant);
      return tenant;

    } catch (error) {
      console.error('❌ Error getting tenant:', error);
      throw new Error(`Failed to get tenant: ${error.message}`);
    }
  }

  /**
   * GET ALL TENANTS
   */
  async getAllTenants() {
    try {
      const tenants = await Tenant.find({
        isDeleted: false
      }).sort({ createdAt: -1 });

      return tenants;
    } catch (error) {
      console.error('❌ Error getting all tenants:', error);
      throw new Error(`Failed to get tenants: ${error.message}`);
    }
  }

  /**
   * GET TENANT BY DOMAIN
   */
  async getTenantByDomain(domain) {
    try {
      const tenant = await Tenant.findOne({
        domain: domain,
        isActive: true,
        isDeleted: false
      });

      return tenant;
    } catch (error) {
      console.error('❌ Error getting tenant by domain:', error);
      throw new Error(`Failed to get tenant by domain: ${error.message}`);
    }
  }

  /**
   * INCREMENT API CALLS
   */
  async incrementApiCalls(tenantId) {
    try {
      await Tenant.findByIdAndUpdate(tenantId, {
        $inc: { 'usage.apiCallsThisMonth': 1 }
      });
    } catch (error) {
      console.error('❌ Error incrementing API calls:', error);
    }
  }

  /**
   * TRACK USER ACTIVITY
   */
  async trackUserActivity(tenantId, userId, activity) {
    try {
      // This would typically be stored in a separate analytics collection
      console.log('📊 Tracking user activity:', { tenantId, userId, activity });
    } catch (error) {
      console.error('❌ Error tracking user activity:', error);
    }
  }

  /**
   * GET TOTAL TENANTS
   */
  async getTotalTenants() {
    try {
      return await Tenant.countDocuments({ isDeleted: false });
    } catch (error) {
      console.error('❌ Error getting total tenants:', error);
      return 0;
    }
  }

  /**
   * GET ACTIVE TENANTS
   */
  async getActiveTenants() {
    try {
      return await Tenant.countDocuments({ 
        isActive: true, 
        isDeleted: false 
      });
    } catch (error) {
      console.error('❌ Error getting active tenants:', error);
      return 0;
    }
  }

  /**
   * UPDATE TENANT CONFIGURATION
   */
  async updateTenant(tenantId, updateData) {
    try {
      console.log('🔄 Updating tenant:', tenantId);

      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Update tenant data
      Object.assign(tenant, updateData);
      tenant.metadata.lastUpdated = new Date();
      await tenant.save();

      // Update cache
      this.tenantCache.set(tenantId, tenant);

      console.log('✅ Tenant updated successfully');
      return {
        success: true,
        tenant: tenant,
        message: 'Tenant updated successfully'
      };

    } catch (error) {
      console.error('❌ Error updating tenant:', error);
      throw new Error(`Failed to update tenant: ${error.message}`);
    }
  }

  /**
   * DELETE TENANT (SOFT DELETE)
   */
  async deleteTenant(tenantId) {
    try {
      console.log('🗑️ Deleting tenant:', tenantId);

      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Soft delete
      tenant.isDeleted = true;
      tenant.deletedAt = new Date();
      await tenant.save();

      // Remove from cache
      this.tenantCache.delete(tenantId);

      console.log('✅ Tenant deleted successfully');
      return {
        success: true,
        message: 'Tenant deleted successfully'
      };

    } catch (error) {
      console.error('❌ Error deleting tenant:', error);
      throw new Error(`Failed to delete tenant: ${error.message}`);
    }
  }

  /**
   * GET TENANT ANALYTICS
   */
  async getTenantAnalytics(tenantId) {
    try {
      const tenant = await this.getTenant(tenantId);
      
      // Get user count
      const userCount = await User.countDocuments({ tenantId: tenantId });
      
      // Get job count
      const jobCount = await Job.countDocuments({ tenantId: tenantId });
      
      // Get usage statistics
      const usage = {
        users: userCount,
        jobs: jobCount,
        storage: tenant.usage.currentStorageGB,
        apiCalls: tenant.usage.apiCallsThisMonth
      };

      // Get limits
      const limits = tenant.limits;

      // Calculate usage percentages
      const usagePercentages = {
        users: (usage.users / limits.maxUsers) * 100,
        storage: (usage.storage / limits.maxStorageGB) * 100,
        apiCalls: (usage.apiCalls / limits.maxApiCalls) * 100
      };

      return {
        success: true,
        analytics: {
          usage,
          limits,
          percentages: usagePercentages,
          tenant: {
            name: tenant.name,
            plan: tenant.subscription.plan,
            status: tenant.subscription.status,
            createdAt: tenant.createdAt
          }
        }
      };

    } catch (error) {
      console.error('❌ Error getting tenant analytics:', error);
      throw new Error(`Failed to get tenant analytics: ${error.message}`);
    }
  }

  /**
   * UPDATE TENANT BRANDING
   */
  async updateTenantBranding(tenantId, brandingData) {
    try {
      console.log('🎨 Updating tenant branding:', tenantId);

      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Update branding
      Object.assign(tenant.branding, brandingData);
      await tenant.save();

      // Update brand cache
      this.brandCache.set(tenantId, tenant.branding);

      console.log('✅ Tenant branding updated successfully');
      return {
        success: true,
        branding: tenant.branding,
        message: 'Tenant branding updated successfully'
      };

    } catch (error) {
      console.error('❌ Error updating tenant branding:', error);
      throw new Error(`Failed to update tenant branding: ${error.message}`);
    }
  }

  /**
   * GET TENANT BRANDING
   */
  async getTenantBranding(tenantId) {
    try {
      // Check cache first
      if (this.brandCache.has(tenantId)) {
        return this.brandCache.get(tenantId);
      }

      const tenant = await this.getTenant(tenantId);
      const branding = tenant.branding;

      // Cache branding
      this.brandCache.set(tenantId, branding);

      return branding;

    } catch (error) {
      console.error('❌ Error getting tenant branding:', error);
      throw new Error(`Failed to get tenant branding: ${error.message}`);
    }
  }

  /**
   * VALIDATE TENANT ACCESS
   */
  async validateTenantAccess(tenantId, userId) {
    try {
      // Check if user belongs to tenant
      const user = await User.findOne({ _id: userId, tenantId: tenantId });
      if (!user) {
        throw new Error('User does not belong to this tenant');
      }

      // Check if tenant is active
      const tenant = await this.getTenant(tenantId);
      if (!tenant.isActive) {
        throw new Error('Tenant is not active');
      }

      return {
        success: true,
        user: user,
        tenant: tenant
      };

    } catch (error) {
      console.error('❌ Error validating tenant access:', error);
      throw new Error(`Failed to validate tenant access: ${error.message}`);
    }
  }

  /**
   * HELPER METHODS
   */

  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }

  calculateExpirationDate(plan) {
    const now = new Date();
    switch (plan) {
      case 'starter':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
      case 'professional':
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
      case 'enterprise':
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    }
  }

  getPlanLimits(plan) {
    const limits = {
      starter: {
        maxUsers: 10,
        maxStorageGB: 1,
        maxPolls: 100,
        maxApiCalls: 1000
      },
      professional: {
        maxUsers: 100,
        maxStorageGB: 10,
        maxPolls: 1000,
        maxApiCalls: 10000
      },
      enterprise: {
        maxUsers: 1000,
        maxStorageGB: 100,
        maxPolls: 10000,
        maxApiCalls: 100000
      }
    };

    return limits[plan] || limits.starter;
  }

  getPlanFeatures(plan) {
    const features = {
      starter: {
        polls: { enabled: true, maxPolls: 100 },
        analytics: { enabled: true, retention: '30days' },
        branding: { enabled: false, allowCustomLogo: false },
        apiAccess: { enabled: false, rateLimit: 100 },
        fileUpload: { enabled: true, maxSize: '5MB' },
        notifications: { enabled: true, channels: ['email'] },
        advancedFeatures: {
          multiLanguage: { enabled: false },
          sso: { enabled: false },
          auditLog: { enabled: false }
        }
      },
      professional: {
        polls: { enabled: true, maxPolls: 1000 },
        analytics: { enabled: true, retention: '90days' },
        branding: { enabled: true, allowCustomLogo: true },
        apiAccess: { enabled: true, rateLimit: 1000 },
        fileUpload: { enabled: true, maxSize: '10MB' },
        notifications: { enabled: true, channels: ['email', 'in-app'] },
        advancedFeatures: {
          multiLanguage: { enabled: false },
          sso: { enabled: false },
          auditLog: { enabled: true }
        }
      },
      enterprise: {
        polls: { enabled: true, maxPolls: 10000 },
        analytics: { enabled: true, retention: '1year' },
        branding: { enabled: true, allowCustomLogo: true },
        apiAccess: { enabled: true, rateLimit: 10000 },
        fileUpload: { enabled: true, maxSize: '50MB' },
        notifications: { enabled: true, channels: ['email', 'in-app', 'sms'] },
        advancedFeatures: {
          multiLanguage: { enabled: true },
          sso: { enabled: true },
          auditLog: { enabled: true }
        }
      }
    };

    return features[plan] || features.starter;
  }

  async createDefaultAdmin(tenantId, tenantData) {
    try {
      const adminUser = {
        _id: new mongoose.Types.ObjectId(),
        firstName: tenantData.adminFirstName || 'Admin',
        lastName: tenantData.adminLastName || 'User',
        email: tenantData.contactEmail,
        password: await bcrypt.hash(tenantData.adminPassword || 'admin123', 10),
        role: 'admin',
        tenantId: tenantId,
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date()
      };

      const user = new User(adminUser);
      await user.save();

      console.log('✅ Default admin user created for tenant:', tenantId);
      return user;

    } catch (error) {
      console.error('❌ Error creating default admin:', error);
      throw error;
    }
  }

  async initializeTenantBranding(tenantId, branding) {
    try {
      // Create tenant-specific branding directory
      const brandingPath = `/branding/${tenantId}`;
      
      // Initialize default branding if not provided
      if (!branding.logo) {
        branding.logo = `${brandingPath}/logo.svg`;
      }

      console.log('✅ Tenant branding initialized:', tenantId);
      return branding;

    } catch (error) {
      console.error('❌ Error initializing tenant branding:', error);
      throw error;
    }
  }
}

module.exports = new TenantManagementService();
