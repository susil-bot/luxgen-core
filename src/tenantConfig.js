/**
 * LUXGEN TENANT CONFIGURATION SYSTEM
 * Centralized tenant configuration management
 */

const tenantConfigurations = {
  luxgen: {
    id: 'luxgen',
    slug: 'luxgen',
    name: 'LuxGen Technologies',
    domain: 'luxgen.com',
    features: [
      'user-management',
      'job-posting',
      'feed-management',
      'analytics',
      'reporting',
      'training-management',
      'assessment-tools',
      'certification-system'
    ],
    limits: {
      maxUsers: 1000,
      maxStorage: 1000000, // 1GB in MB
      maxApiCalls: 10000,
      maxConcurrentSessions: 100,
      dataRetentionDays: 365,
      maxJobPosts: 100,
      maxTrainingPrograms: 50,
      maxAssessments: 200
    },
    branding: {
      primaryColor: '#FF6B35',
      secondaryColor: '#2C3E50',
      logo: 'https://luxgen.com/logo.png',
      favicon: 'https://luxgen.com/favicon.ico',
      customCSS: null
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
      sessionTimeout: 3600, // 1 hour
      ipWhitelist: [],
      allowedDomains: ['luxgen.com', '*.luxgen.com']
    },
    dataRetention: {
      userData: 365,
      activityLogs: 90,
      auditLogs: 2555, // 7 years
      temporaryData: 7,
      backupRetention: 30,
      trainingRecords: 2555,
      assessmentResults: 2555
    },
    notifications: {
      email: {
        enabled: true,
        smtp: {
          host: 'smtp.luxgen.com',
          port: 587,
          secure: false
        }
      },
      sms: {
        enabled: false,
        provider: 'twilio'
      },
      push: {
        enabled: true,
        provider: 'firebase'
      }
    },
    integrations: {
      calendar: {
        enabled: true,
        provider: 'google'
      },
      storage: {
        enabled: true,
        provider: 'aws-s3'
      },
      analytics: {
        enabled: true,
        provider: 'google-analytics'
      }
    },
    workflows: {
      enabled: true,
      available: [
        'job-post-management',
        'user-management',
        'feed-management',
        'training-workflow',
        'assessment-workflow'
      ]
    }
  },
  
  demo: {
    id: 'demo',
    slug: 'demo',
    name: 'Demo Organization',
    domain: 'demo.luxgen.com',
    features: [
      'user-management',
      'job-posting',
      'feed-management',
      'analytics'
    ],
    limits: {
      maxUsers: 50,
      maxStorage: 100000, // 100MB
      maxApiCalls: 1000,
      maxConcurrentSessions: 10,
      dataRetentionDays: 30,
      maxJobPosts: 10,
      maxTrainingPrograms: 5,
      maxAssessments: 20
    },
    branding: {
      primaryColor: '#4A90E2',
      secondaryColor: '#7B68EE',
      logo: 'https://demo.luxgen.com/logo.png',
      favicon: 'https://demo.luxgen.com/favicon.ico',
      customCSS: null
    },
    security: {
      encryptionEnabled: true,
      ssoEnabled: false,
      mfaRequired: false,
      passwordPolicy: {
        minLength: 6,
        requireUppercase: false,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        maxAge: 180
      },
      sessionTimeout: 7200, // 2 hours
      ipWhitelist: [],
      allowedDomains: ['demo.luxgen.com']
    },
    dataRetention: {
      userData: 30,
      activityLogs: 7,
      auditLogs: 90,
      temporaryData: 1,
      backupRetention: 7,
      trainingRecords: 90,
      assessmentResults: 90
    },
    notifications: {
      email: {
        enabled: true,
        smtp: {
          host: 'smtp.demo.luxgen.com',
          port: 587,
          secure: false
        }
      },
      sms: {
        enabled: false,
        provider: 'twilio'
      },
      push: {
        enabled: false,
        provider: 'firebase'
      }
    },
    integrations: {
      calendar: {
        enabled: false,
        provider: 'google'
      },
      storage: {
        enabled: true,
        provider: 'local'
      },
      analytics: {
        enabled: false,
        provider: 'google-analytics'
      }
    },
    workflows: {
      enabled: true,
      available: [
        'job-post-management',
        'user-management',
        'feed-management'
      ]
    }
  }
};

/**
 * Get tenant configuration by ID or slug
 */
function getTenantConfig(identifier) {
  // Try by ID first
  if (tenantConfigurations[identifier]) {
    return tenantConfigurations[identifier];
  }
  
  // Try by slug
  for (const [id, config] of Object.entries(tenantConfigurations)) {
    if (config.slug === identifier) {
      return config;
    }
  }
  
  // Return default luxgen config if not found
  return tenantConfigurations.luxgen;
}

/**
 * Get all available tenants
 */
function getAllTenants() {
  return Object.values(tenantConfigurations);
}

/**
 * Check if tenant has specific feature
 */
function hasFeature(tenantId, feature) {
  const config = getTenantConfig(tenantId);
  return config.features.includes(feature);
}

/**
 * Check if tenant has specific workflow
 */
function hasWorkflow(tenantId, workflowId) {
  const config = getTenantConfig(tenantId);
  return config.workflows.enabled && config.workflows.available.includes(workflowId);
}

/**
 * Get tenant limits
 */
function getTenantLimits(tenantId) {
  const config = getTenantConfig(tenantId);
  return config.limits;
}

/**
 * Get tenant branding
 */
function getTenantBranding(tenantId) {
  const config = getTenantConfig(tenantId);
  return config.branding;
}

/**
 * Get tenant security settings
 */
function getTenantSecurity(tenantId) {
  const config = getTenantConfig(tenantId);
  return config.security;
}

/**
 * Get tenant data retention policy
 */
function getTenantDataRetention(tenantId) {
  const config = getTenantConfig(tenantId);
  return config.dataRetention;
}

/**
 * Validate tenant access
 */
function validateTenantAccess(tenantId, userId, requiredFeature = null) {
  const config = getTenantConfig(tenantId);
  
  // Check if tenant exists
  if (!config) {
    return { valid: false, reason: 'Tenant not found' };
  }
  
  // Check feature requirement
  if (requiredFeature && !hasFeature(tenantId, requiredFeature)) {
    return { valid: false, reason: `Feature '${requiredFeature}' not available for this tenant` };
  }
  
  // Check user limits
  // This would typically check against actual user count in database
  // For now, we'll assume it's within limits
  
  return { valid: true, config };
}

/**
 * Get tenant workflow configuration
 */
function getTenantWorkflowConfig(tenantId) {
  const config = getTenantConfig(tenantId);
  return {
    enabled: config.workflows.enabled,
    available: config.workflows.available,
    tenantId: config.id,
    tenantSlug: config.slug,
    tenantName: config.name
  };
}

/**
 * Create tenant-specific workflow ID
 */
function createTenantWorkflowId(tenantId, workflowId) {
  return `${tenantId}_${workflowId}`;
}

/**
 * Extract tenant ID from workflow ID
 */
function extractTenantFromWorkflowId(workflowId) {
  const parts = workflowId.split('_');
  if (parts.length >= 2) {
    return parts[0];
  }
  return null;
}

/**
 * Get tenant context for workflows
 */
function getTenantContext(tenantId, userId = null, userRole = null) {
  const config = getTenantConfig(tenantId);
  
  return {
    tenantId: config.id,
    tenantSlug: config.slug,
    tenantName: config.name,
    tenantConfig: config,
    userId,
    userRole,
    features: config.features,
    limits: config.limits,
    branding: config.branding,
    security: config.security,
    workflows: config.workflows
  };
}

module.exports = {
  tenantConfigurations,
  getTenantConfig,
  getAllTenants,
  hasFeature,
  hasWorkflow,
  getTenantLimits,
  getTenantBranding,
  getTenantSecurity,
  getTenantDataRetention,
  validateTenantAccess,
  getTenantWorkflowConfig,
  createTenantWorkflowId,
  extractTenantFromWorkflowId,
  getTenantContext
};
