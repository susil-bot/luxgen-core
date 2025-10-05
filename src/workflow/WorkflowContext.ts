/**
 * LUXGEN WORKFLOW CONTEXT
 * Global workflow context for multi-tenancy data flow
 */

import { Request, Response } from 'express';
import { TenantId, UserId } from '../types/common';

export interface WorkflowContext {
  // Request/Response context
  request: Request;
  response: Response;
  
  // Tenant context
  tenantId: TenantId;
  tenantSlug: string;
  tenantConfig: TenantConfiguration;
  
  // User context
  userId?: UserId;
  userRole?: string;
  userPermissions: string[];
  
  // Data context
  data: Record<string, any>;
  metadata: Record<string, any>;
  
  // Workflow state
  workflowId: string;
  stepId: string;
  previousStep?: string;
  nextStep?: string;
  
  // Execution context
  startTime: Date;
  timeout: number;
  retryCount: number;
  maxRetries: number;
  
  // Multi-tenancy flags
  isTenantIsolated: boolean;
  crossTenantAccess: boolean;
  dataEncryption: boolean;
  
  // Performance tracking
  performanceMetrics: PerformanceMetrics;
  
  // Error handling
  errorContext: ErrorContext;
  
  // Audit trail
  auditTrail: AuditEntry[];
}

export interface TenantConfiguration {
  id: string;
  slug: string;
  name: string;
  domain?: string;
  features: string[];
  limits: TenantLimits;
  branding: TenantBranding;
  security: TenantSecurity;
  dataRetention: DataRetentionPolicy;
}

export interface TenantLimits {
  maxUsers: number;
  maxStorage: number;
  maxApiCalls: number;
  maxConcurrentSessions: number;
  dataRetentionDays: number;
}

export interface TenantBranding {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  customCss?: string;
  customDomain?: string;
}

export interface TenantSecurity {
  encryptionEnabled: boolean;
  ssoEnabled: boolean;
  mfaRequired: boolean;
  passwordPolicy: PasswordPolicy;
  sessionTimeout: number;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number;
}

export interface DataRetentionPolicy {
  userData: number;
  activityLogs: number;
  auditLogs: number;
  temporaryData: number;
  backupRetention: number;
}

export interface PerformanceMetrics {
  startTime: Date;
  endTime?: Date;
  duration?: number;
  memoryUsage: number;
  cpuUsage: number;
  databaseQueries: number;
  apiCalls: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface ErrorContext {
  hasError: boolean;
  errorType?: string;
  errorMessage?: string;
  errorCode?: string;
  errorStack?: string;
  retryable: boolean;
  userFriendlyMessage: string;
}

export interface AuditEntry {
  timestamp: Date;
  action: string;
  userId?: string;
  tenantId: string;
  resource: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'validation' | 'transformation' | 'business-logic' | 'data-access' | 'notification';
  dependencies: string[];
  timeout: number;
  retryable: boolean;
  critical: boolean;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  conditions: WorkflowCondition[];
  errorHandling: WorkflowErrorHandling;
  tenantSpecific: boolean;
  crossTenantAllowed: boolean;
}

export interface WorkflowTrigger {
  type: 'api-call' | 'scheduled' | 'event' | 'manual';
  conditions: Record<string, any>;
  schedule?: string;
  event?: string;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not-equals' | 'contains' | 'greater-than' | 'less-than';
  value: any;
  required: boolean;
}

export interface WorkflowErrorHandling {
  strategy: 'fail-fast' | 'continue-on-error' | 'retry' | 'fallback';
  maxRetries: number;
  retryDelay: number;
  fallbackWorkflow?: string;
  notifications: NotificationConfig[];
}

export interface NotificationConfig {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  recipients: string[];
  template: string;
  conditions: Record<string, any>;
}

/**
 * Create a new workflow context
 */
export function createWorkflowContext(
  request: Request,
  response: Response,
  tenantId: TenantId,
  tenantSlug: string,
  tenantConfig: TenantConfiguration,
  userId?: UserId,
  userRole?: string
): WorkflowContext {
  return {
    request,
    response,
    tenantId,
    tenantSlug,
    tenantConfig,
    userId,
    userRole,
    userPermissions: [],
    data: {},
    metadata: {},
    workflowId: generateWorkflowId(),
    stepId: 'initial',
    startTime: new Date(),
    timeout: 30000, // 30 seconds default
    retryCount: 0,
    maxRetries: 3,
    isTenantIsolated: true,
    crossTenantAccess: false,
    dataEncryption: tenantConfig.security.encryptionEnabled,
    performanceMetrics: {
      startTime: new Date(),
      memoryUsage: process.memoryUsage().heapUsed,
      cpuUsage: 0,
      databaseQueries: 0,
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0
    },
    errorContext: {
      hasError: false,
      retryable: true,
      userFriendlyMessage: ''
    },
    auditTrail: []
  };
}

/**
 * Generate unique workflow ID
 */
function generateWorkflowId(): string {
  return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Update workflow context with new data
 */
export function updateWorkflowContext(
  context: WorkflowContext,
  updates: Partial<WorkflowContext>
): WorkflowContext {
  return {
    ...context,
    ...updates,
    metadata: {
      ...context.metadata,
      lastUpdated: new Date(),
      ...updates.metadata
    }
  };
}

/**
 * Add audit entry to workflow context
 */
export function addAuditEntry(
  context: WorkflowContext,
  action: string,
  resource: string,
  details: Record<string, any> = {}
): WorkflowContext {
  const auditEntry: AuditEntry = {
    timestamp: new Date(),
    action,
    userId: context.userId,
    tenantId: context.tenantId,
    resource,
    details,
    ipAddress: context.request.ip,
    userAgent: context.request.get('User-Agent')
  };

  return {
    ...context,
    auditTrail: [...context.auditTrail, auditEntry]
  };
}

/**
 * Check if workflow context has required permissions
 */
export function hasPermission(
  context: WorkflowContext,
  permission: string
): boolean {
  return context.userPermissions.includes(permission) || 
         context.userRole === 'super-admin';
}

/**
 * Check if workflow context allows cross-tenant access
 */
export function allowsCrossTenantAccess(context: WorkflowContext): boolean {
  return context.crossTenantAccess && 
         hasPermission(context, 'cross-tenant-access');
}

/**
 * Validate workflow context for multi-tenancy
 */
export function validateWorkflowContext(context: WorkflowContext): boolean {
  // Check tenant isolation
  if (context.isTenantIsolated && !context.tenantId) {
    return false;
  }

  // Check user context if required
  if (context.userId && !context.userRole) {
    return false;
  }

  // Check data encryption if required
  if (context.dataEncryption && !context.tenantConfig.security.encryptionEnabled) {
    return false;
  }

  return true;
}
