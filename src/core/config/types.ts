/**
 * @fileoverview Core Configuration Types
 * TypeScript interfaces for core configuration management
 * 
 * @module
 */

/**
 * Tenant configuration interface
 * Defines the structure for tenant-specific configuration
 */
export interface TenantConfig {
  brandSlug: string;
  humanName: string;
  rootBrand: string;
  copilotCode: string;
  siteDomain: {
    production: string;
    staging?: string;
    development?: string;
  };
  organizationGlobalId: {
    production: string;
    staging?: string;
    development?: string;
  };
  organizationSlug: {
    production: string;
    staging?: string;
    development?: string;
  };
  database: {
    name: string;
    url: string;
    options?: {
      maxPoolSize?: number;
      serverSelectionTimeoutMS?: number;
      socketTimeoutMS?: number;
      bufferCommands?: boolean;
      bufferMaxEntries?: number;
      retryWrites?: boolean;
      retryReads?: boolean;
    };
  };
  features?: string[];
  limits?: {
    maxUsers?: number;
    maxStorage?: number;
    maxApiCalls?: number;
    maxConcurrentSessions?: number;
    dataRetentionDays?: number;
    maxJobPosts?: number;
    maxTrainingPrograms?: number;
    maxAssessments?: number;
  };
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    logo?: string;
    favicon?: string;
    customCSS?: string;
  };
  security?: {
    encryptionEnabled?: boolean;
    ssoEnabled?: boolean;
    mfaRequired?: boolean;
    passwordPolicy?: {
      minLength?: number;
      requireUppercase?: boolean;
      requireLowercase?: boolean;
      requireNumbers?: boolean;
      requireSpecialChars?: boolean;
      maxAge?: number;
    };
  };
  settings?: {
    timezone?: string;
    dateFormat?: string;
    timeFormat?: string;
    language?: string;
    defaultUserRole?: string;
    requireEmailVerification?: boolean;
    allowUserRegistration?: boolean;
    sessionTimeout?: number;
  };
}

/**
 * Environment configuration interface
 */
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CORS_ORIGIN: string;
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
}

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  uri: string;
  options: {
    maxPoolSize: number;
    serverSelectionTimeoutMS: number;
    socketTimeoutMS: number;
    bufferCommands: boolean;
    bufferMaxEntries: number;
    retryWrites: boolean;
    retryReads: boolean;
  };
}

/**
 * Application configuration interface
 */
export interface AppConfig {
  environment: EnvironmentConfig;
  database: DatabaseConfig;
  tenant: TenantConfig;
}
