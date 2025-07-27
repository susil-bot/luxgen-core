/**
 * ACME Corporation Tenant (Configuration
 * Enterprise-level) tenant with advanced features
 */

module.exports = {

  // Basic tenant information
  name: 'ACME Corporation',
  slug: 'acme-corporation',
  status: 'active',
  contactEmail: 'admin@acme.com',
  industry: 'Technology',
  companySize: '51-200',


  // Tenant description
  description: 'Leading technology company with enterprise-grade requirements',


  // Features configuration
  features: {
    polls: {
      enabled: true,
      maxPolls: 200,
      allowAnonymous: false,
      requireApproval: true
    },
    analytics: {
      enabled: true,
      retention: '90days',
      exportEnabled: true,
      realTime: true
    },
    branding: {
      enabled: true,
      allowCustomLogo: true,
      allowCustomColors: true,
      allowCustomDomain: true
    },
    customFields: {
      enabled: true,
      maxFields: 50
    },
    apiAccess: {
      enabled: true,
      rateLimit: 2000,
      allowWebhooks: true,
      apiKeys: true
    },
    fileUpload: {
      enabled: true,
      maxSize: '20MB',
      allowedTypes: ['image/*', 'application/pdf', 'text/*', 'application/zip']
    },
    notifications: {
      enabled: true,
      channels: ['email', 'in-app', 'slack'],
      allowSMS: true
    },
    advancedFeatures: {
      multiLanguage: { enabled: true, languages: ['en', 'es', 'fr'] },
      sso: { enabled: true, provider: 'saml' },
      auditLog: { enabled: true, retention: '1year' },
      dataExport: { enabled: true, formats: ['csv', 'json', 'xlsx'] } }
  },


  // Tenant settings
  settings: {
    allowPublicPolls: false,
    requireEmailVerification: true,
    autoArchivePolls: true,
    maxUsers: 100,
    sessionTimeout: 48,
    // hours
    allowGuestAccess: false,
    passwordPolicy: {
      minLength: 10,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 60
      // days
    },
    security: {
      mfa: { enabled: true, methods: ['totp', 'sms'] },
      ipWhitelist: ['192.168.1.0/24', '10.0.0.0/8'],
      sessionConcurrency: 3,
      passwordHistory: 5
    } },


  // Branding configuration
  branding: {
    logo: '/branding/(acme-corporation/logo).png',
    primaryColor: '#e74c3c',
    secondaryColor: '#2c3e50',
    accentColor: '#f39c12',
    customCss: '/branding/(acme-corporation/custom).css',
    favicon: '/branding/(acme-corporation/favicon).ico',
    theme: 'dark',
    customFont: 'Roboto',
    headerText: 'ACME Corporation - Employee Portal',
    footerText: '© 2024 ACME Corporation. All rights reserved.'
  },


  // Third-party integrations
  integrations: {
    email: {
      provider: 'sendgrid',
      config: {
        apiKey: process.env.ACME_SENDGRID_KEY,
        fromEmail: 'noreply@acme.com',
        templates: {
          welcome: 'd-1234567890',
          resetPassword: 'd-0987654321'
        } }
    },
    storage: {
      provider: 'aws-s3',
      config: {
        bucket: 'acme-luxgen-files',
        region: 'us-east-1',
        accessKeyId: process.env.ACME_AWS_ACCESS_KEY,
        secretAccessKey: process.env.ACME_AWS_SECRET_KEY
      } },
    analytics: {
      provider: 'google-analytics',
      config: {
        trackingId: 'GA-ACME-123',
        anonymizeData: false,
        enhancedEcommerce: true
      } },
    payment: {
      provider: 'stripe',
      config: {
        publishableKey: process.env.ACME_STRIPE_PUBLISHABLE_KEY,
        secretKey: process.env.ACME_STRIPE_SECRET_KEY,
        webhookSecret: process.env.ACME_STRIPE_WEBHOOK_SECRET
      } },
    sso: {
      provider: 'saml',
      config: {
        entryPoint: process.env.ACME_SAML_ENTRY_POINT,
        issuer: 'acme-corporation',
        cert: process.env.ACME_SAML_CERT
      } }
  },


  // Usage limits
  limits: {
    maxPollsPerUser: 100,
    maxResponsesPerPoll: 5000,
    maxFileSize: 20971520,
    // 20MB
    maxStoragePerUser: 2147483648,
    // 2GB
    maxApiCallsPerHour: 2000,
    maxUsers: 100,
    maxCustomFields: 50
  },


  // Custom configurations
  custom: {
    welcomeMessage: 'Welcome to ACME Corporation! Access your employee tools and resources.',
    helpEmail: 'it-support@acme.com',
    supportPhone: '+1-800-ACME-HELP',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    departments: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'],
    officeLocations: ['New York', 'San Francisco', 'London', 'Tokyo']
  },


  // Metadata
  metadata: {
    createdAt: '2024-01-01T00:00:00Z',
    createdBy: 'admin',
    lastUpdated: '2024-01-01T00:00:00Z',
    version: '2.0.0',
    tags: ['enterprise', 'technology', 'saml', 'advanced']
  } }