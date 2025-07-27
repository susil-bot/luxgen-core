/**
 * Demo Tenant Configuration
 * This is a sample tenant configuration for demonstration purposes
 */

module.exports = {

  // Basic tenant information
  name: 'Demo Company',
  slug: 'demo-tenant',
  status: 'active',
  contactEmail: 'admin@democompany.com',
  industry: 'Technology',
  companySize: '11-50',


  // Tenant description
  description: 'A demonstration tenant for showcasing LuxGen features',


  // Features configuration
  features: {
    polls: {
      enabled: true,
      maxPolls: 50,
      allowAnonymous: true,
      requireApproval: false
    },
    analytics: {
      enabled: true,
      retention: '30days',
      exportEnabled: true
    },
    branding: {
      enabled: true,
      allowCustomLogo: true,
      allowCustomColors: true
    },
    customFields: {
      enabled: false,
      maxFields: 10
    },
    apiAccess: {
      enabled: true,
      rateLimit: 1000,
      allowWebhooks: true
    },
    fileUpload: {
      enabled: true,
      maxSize: '10MB',
      allowedTypes: ['image/*', 'application/pdf', 'text/*']
    },
    notifications: {
      enabled: true,
      channels: ['email', 'in-app'],
      allowSMS: false
    },
    advancedFeatures: {
      multiLanguage: { enabled: false },
      sso: { enabled: false },
      auditLog: { enabled: true }
    }
  },


  // Tenant settings
  settings: {
    allowPublicPolls: true,
    requireEmailVerification: false,
    autoArchivePolls: false,
    maxUsers: 25,
    sessionTimeout: 12,
    // hours
    allowGuestAccess: true,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: false,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      maxAge: 90
      // days
    },
    security: {
      mfa: { enabled: false },
      ipWhitelist: [],
      sessionConcurrency: 1
    }
  },


  // Branding configuration
  branding: {
    logo: '/branding/(demo-tenant/logo).png',
    primaryColor: '#007bff',
    secondaryColor: '#6c757d',
    accentColor: '#28a745',
    customCss: '/branding/(demo-tenant/custom).css',
    favicon: '/branding/(demo-tenant/favicon).ico',
    theme: 'light',
    customFont: null,
    headerText: 'Demo Company Portal',
    footerText: '© 2024 Demo Company. Powered by LuxGen.'
  },


  // Third-party integrations
  integrations: {
    email: {
      provider: 'smtp',
      config: {
        host: process.env.DEMO_SMTP_HOST || 'smtp.gmail.com',
        port: process.env.DEMO_SMTP_PORT || 587,
        secure: false
      }
    },
    storage: {
      provider: 'local',
      config: {
        path: '/(uploads/demo-tenant)',
        backupEnabled: true
      }
    },
    analytics: {
      provider: 'internal',
      config: {
        trackingId: 'DEMO-001',
        anonymizeData: true
      }
    },
    payment: {
      provider: 'stripe',
      config: {
        publishableKey: process.env.DEMO_STRIPE_PUBLISHABLE_KEY,
        secretKey: process.env.DEMO_STRIPE_SECRET_KEY
      }
    }
  },


  // Usage limits
  limits: {
    maxPollsPerUser: 25,
    maxResponsesPerPoll: 500,
    maxFileSize: 10485760,
    // 10MB
    maxStoragePerUser: 1073741824,
    // 1GB
    maxApiCallsPerHour: 1000,
    maxUsers: 25,
    maxCustomFields: 10
  },


  // Custom configurations
  custom: {
    welcomeMessage: 'Welcome to Demo Company! This is a demonstration of LuxGen features.',
    helpEmail: 'help@democompany.com',
    supportPhone: '+1-555-0123',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h'
  },


  // Metadata
  metadata: {
    createdAt: '2024-01-01T00:00:00Z',
    createdBy: 'system',
    lastUpdated: '2024-01-01T00:00:00Z',
    version: '1.0.0',
    tags: ['demo', 'sample', 'technology']
  }
};
