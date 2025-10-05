/**
 * @fileoverview Tenant Configuration Switcher
 * Configuration-based database switching and tenant routing with comprehensive error handling
 * 
 * @module
 */

import { Request } from 'express';
import { tenantDatabaseManager } from './TenantDatabaseManager';
import {
  TenantDatabaseContext,
  TenantDatabaseOperationResult,
  TenantDatabaseError,
  TenantDatabaseErrorType,
  TenantDatabaseEventType
} from '../../types/tenant/TenantDatabaseTypes';

/**
 * Tenant configuration interface
 */
export interface TenantConfig {
  id: string;
  slug: string;
  name: string;
  domain: string;
  features: string[];
  limits: {
    maxUsers: number;
    maxStorage: number;
    maxApiCalls: number;
    maxConcurrentSessions: number;
    dataRetentionDays: number;
    maxJobPosts: number;
    maxTrainingPrograms: number;
    maxAssessments: number;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logo: string;
    favicon: string;
    customCSS?: string;
  };
  security: {
    encryptionEnabled: boolean;
    ssoEnabled: boolean;
    mfaRequired: boolean;
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
      maxAge: number;
    };
  };
  settings: {
    timezone: string;
    dateFormat: string;
    timeFormat: string;
    language: string;
    defaultUserRole: string;
    requireEmailVerification: boolean;
    allowUserRegistration: boolean;
    sessionTimeout: number;
  };
}

/**
 * Tenant limits check result
 */
export interface TenantLimitsResult {
  withinLimits: boolean;
  limits: {
    users: { current: number; max: number };
    storage: { current: number; max: number };
  };
  error?: string;
}

/**
 * Tenant statistics interface
 */
export interface TenantStatistics {
  tenantId: string;
  name: string;
  slug: string;
  domain: string;
  databaseStats?: any;
  limits?: TenantLimitsResult;
  isInitialized: boolean;
  error?: string;
}

/**
 * TENANT CONFIGURATION SWITCHER
 * Comprehensive tenant configuration management with database switching
 * 
 * Features:
 * - Configuration-based database switching
 * - Tenant initialization from config
 * - Domain/subdomain-based tenant selection
 * - Tenant limits and feature checking
 * - Error handling and recovery
 * - Performance monitoring
 */
export class TenantConfigSwitcher {
  private static instance: TenantConfigSwitcher;
  private tenantConfigs: Map<string, TenantConfig> = new Map();
  private initializedTenants: Set<string> = new Set();

  private constructor() {
    this.loadTenantConfigurations();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): TenantConfigSwitcher {
    if (!TenantConfigSwitcher.instance) {
      TenantConfigSwitcher.instance = new TenantConfigSwitcher();
    }
    return TenantConfigSwitcher.instance;
  }

  /**
   * Load tenant configurations
   */
  private loadTenantConfigurations(): void {
    // Load from tenantConfig.js or environment
    try {
      const tenantConfig = require('../tenantConfig');
      Object.entries(tenantConfig).forEach(([id, config]) => {
        this.tenantConfigs.set(id, config as TenantConfig);
      });
    } catch (error) {
      console.error('❌ Failed to load tenant configurations:', error);
    }
  }

  /**
   * Get tenant configuration by ID or slug
   * 
   * @param tenantIdentifier - Tenant ID or slug
   * @returns Tenant configuration or null if not found
   */
  getTenantConfig(tenantIdentifier: string): TenantConfig | null {
    // Try by ID first
    if (this.tenantConfigs.has(tenantIdentifier)) {
      return this.tenantConfigs.get(tenantIdentifier)!;
    }

    // Try by slug
    for (const [id, config] of this.tenantConfigs) {
      if (config.slug === tenantIdentifier) {
        return config;
      }
    }

    return null;
  }

  /**
   * Initialize tenant based on configuration
   * 
   * @param tenantIdentifier - Tenant ID or slug
   * @returns Promise resolving to initialization result
   */
  async initializeTenantFromConfig(tenantIdentifier: string): Promise<TenantDatabaseOperationResult> {
    try {
      const config = this.getTenantConfig(tenantIdentifier);
      
      if (!config) {
        throw new Error(`Tenant configuration not found: ${tenantIdentifier}`);
      }

      const tenantId = config.id;
      
      // Check if already initialized
      if (this.initializedTenants.has(tenantId)) {
        const models = tenantDatabaseManager.getTenantModels(tenantId);
        return {
          success: true,
          data: { config, models },
          tenantId,
          operation: 'initializeFromConfig',
          timestamp: new Date()
        };
      }

      // Initialize tenant database
      const initResult = await tenantDatabaseManager.initializeTenantDatabase(tenantId);
      if (!initResult.success) {
        throw new Error(`Failed to initialize tenant database: ${initResult.error}`);
      }

      const { connection, models } = initResult.data!;
      
      // Mark as initialized
      this.initializedTenants.add(tenantId);
      
      console.log(`✅ Initialized tenant from config: ${tenantId}`);
      return {
        success: true,
        data: { config, connection, models },
        tenantId,
        operation: 'initializeFromConfig',
        timestamp: new Date()
      };
    } catch (error) {
      const tenantError: TenantDatabaseError = {
        name: 'TenantConfigError',
        message: `Failed to initialize tenant from config ${tenantIdentifier}: ${(error as Error).message}`,
        type: TenantDatabaseErrorType.OPERATION_FAILED,
        tenantId: tenantIdentifier,
        operation: 'initializeTenantFromConfig',
        timestamp: new Date(),
        retryable: true
      };
      
      console.error(`❌ Failed to initialize tenant from config ${tenantIdentifier}:`, error);
      return {
        success: false,
        error: tenantError.message,
        tenantId: tenantIdentifier,
        operation: 'initializeFromConfig',
        timestamp: new Date()
      };
    }
  }

  /**
   * Switch to tenant based on configuration
   * 
   * @param tenantIdentifier - Tenant ID or slug
   * @param req - Express request object
   * @returns Promise resolving to switch result
   */
  async switchToTenant(tenantIdentifier: string, req: Request): Promise<TenantDatabaseOperationResult> {
    try {
      const initResult = await this.initializeTenantFromConfig(tenantIdentifier);
      if (!initResult.success) {
        throw new Error(`Failed to initialize tenant: ${initResult.error}`);
      }

      const { config, models } = initResult.data!;
      
      // Update request with tenant context
      (req as any).tenantId = config.id;
      (req as any).tenantSlug = config.slug;
      (req as any).tenant = config;
      (req as any).tenantModels = models;
      (req as any).tenantContext = {
        tenantId: config.id,
        tenantSlug: config.slug,
        config: config,
        models: models,
        databaseName: tenantDatabaseManager.getTenantDatabaseName(config.id)
      };

      console.log(`🔄 Switched to tenant: ${config.name} (${config.id})`);
      return {
        success: true,
        data: { config, models },
        tenantId: config.id,
        operation: 'switchToTenant',
        timestamp: new Date()
      };
    } catch (error) {
      const tenantError: TenantDatabaseError = {
        name: 'TenantSwitchError',
        message: `Failed to switch to tenant ${tenantIdentifier}: ${(error as Error).message}`,
        type: TenantDatabaseErrorType.OPERATION_FAILED,
        tenantId: tenantIdentifier,
        operation: 'switchToTenant',
        timestamp: new Date(),
        retryable: true
      };
      
      console.error(`❌ Failed to switch to tenant ${tenantIdentifier}:`, error);
      return {
        success: false,
        error: tenantError.message,
        tenantId: tenantIdentifier,
        operation: 'switchToTenant',
        timestamp: new Date()
      };
    }
  }

  /**
   * Get tenant by domain
   * 
   * @param domain - Domain name
   * @returns Promise resolving to tenant configuration
   */
  async getTenantByDomain(domain: string): Promise<TenantConfig | null> {
    for (const [id, config] of this.tenantConfigs) {
      if (config.domain === domain) {
        return config;
      }
    }
    return null;
  }

  /**
   * Get tenant by subdomain
   * 
   * @param subdomain - Subdomain name
   * @returns Promise resolving to tenant configuration
   */
  async getTenantBySubdomain(subdomain: string): Promise<TenantConfig | null> {
    for (const [id, config] of this.tenantConfigs) {
      if (config.slug === subdomain) {
        return config;
      }
    }
    return null;
  }

  /**
   * Check if tenant has specific feature
   * 
   * @param tenantId - Tenant ID
   * @param feature - Feature name
   * @returns True if tenant has the feature
   */
  hasFeature(tenantId: string, feature: string): boolean {
    const config = this.getTenantConfig(tenantId);
    if (!config) return false;
    
    return config.features && config.features.includes(feature);
  }

  /**
   * Check if tenant is within limits
   * 
   * @param tenantId - Tenant ID
   * @returns Promise resolving to limits check result
   */
  async checkTenantLimits(tenantId: string): Promise<TenantLimitsResult> {
    try {
      const config = this.getTenantConfig(tenantId);
      if (!config) {
        return { 
          withinLimits: false, 
          limits: { users: { current: 0, max: 0 }, storage: { current: 0, max: 0 } },
          error: 'Tenant not found' 
        };
      }

      const models = tenantDatabaseManager.getTenantModels(tenantId);
      
      // Check user limits
      const userCount = await models.User.countDocuments({ tenantId });
      const maxUsers = config.limits?.maxUsers || 1000;
      
      // Check storage limits (simplified)
      const storageStats = await tenantDatabaseManager.getTenantDatabaseStats(tenantId);
      const maxStorage = config.limits?.maxStorage || 1000000; // 1GB in MB
      
      return {
        withinLimits: userCount < maxUsers && storageStats.dataSize < maxStorage,
        limits: {
          users: { current: userCount, max: maxUsers },
          storage: { current: storageStats.dataSize, max: maxStorage }
        }
      };
    } catch (error) {
      console.error(`❌ Failed to check tenant limits for ${tenantId}:`, error);
      return { 
        withinLimits: false, 
        limits: { users: { current: 0, max: 0 }, storage: { current: 0, max: 0 } },
        error: (error as Error).message 
      };
    }
  }

  /**
   * Get all available tenants
   * 
   * @returns Array of tenant configurations
   */
  getAllTenants(): TenantConfig[] {
    return Array.from(this.tenantConfigs.values());
  }

  /**
   * Get tenant statistics
   * 
   * @returns Promise resolving to tenant statistics
   */
  async getTenantStatistics(): Promise<TenantStatistics[]> {
    try {
      const tenants = this.getAllTenants();
      const statistics: TenantStatistics[] = [];

      for (const tenant of tenants) {
        try {
          const stats = await tenantDatabaseManager.getTenantDatabaseStats(tenant.id);
          const limits = await this.checkTenantLimits(tenant.id);
          
          statistics.push({
            tenantId: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            domain: tenant.domain,
            databaseStats: stats,
            limits: limits,
            isInitialized: this.initializedTenants.has(tenant.id)
          });
        } catch (error) {
          console.error(`❌ Failed to get stats for tenant ${tenant.id}:`, error);
          statistics.push({
            tenantId: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            domain: tenant.domain,
            error: (error as Error).message
          });
        }
      }

      return statistics;
    } catch (error) {
      console.error('❌ Failed to get tenant statistics:', error);
      throw error;
    }
  }

  /**
   * Cleanup tenant resources
   * 
   * @param tenantId - Tenant ID
   * @returns Promise resolving to cleanup result
   */
  async cleanupTenant(tenantId: string): Promise<TenantDatabaseOperationResult> {
    try {
      await tenantDatabaseManager.closeTenantConnection(tenantId);
      this.initializedTenants.delete(tenantId);
      console.log(`✅ Cleaned up tenant: ${tenantId}`);
      
      return {
        success: true,
        tenantId,
        operation: 'cleanupTenant',
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`❌ Failed to cleanup tenant ${tenantId}:`, error);
      return {
        success: false,
        error: (error as Error).message,
        tenantId,
        operation: 'cleanupTenant',
        timestamp: new Date()
      };
    }
  }

  /**
   * Cleanup all tenant resources
   * 
   * @returns Promise resolving to cleanup result
   */
  async cleanupAll(): Promise<TenantDatabaseOperationResult> {
    try {
      await tenantDatabaseManager.closeAllConnections();
      this.initializedTenants.clear();
      console.log('✅ Cleaned up all tenants');
      
      return {
        success: true,
        tenantId: 'all',
        operation: 'cleanupAll',
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Failed to cleanup all tenants:', error);
      return {
        success: false,
        error: (error as Error).message,
        tenantId: 'all',
        operation: 'cleanupAll',
        timestamp: new Date()
      };
    }
  }
}

export const tenantConfigSwitcher = TenantConfigSwitcher.getInstance();
