/**
 * LUXGEN WORKFLOW RESULT
 * Standardized result object for workflow execution
 */

export interface WorkflowResult<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: WorkflowError[];
  statusCode?: number;
  metadata?: WorkflowMetadata;
  executionTime?: number;
  tenantId?: string;
  workflowId?: string;
  stepId?: string;
}

export interface WorkflowError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stepId?: string;
  retryable: boolean;
  timestamp: Date;
}

export interface WorkflowMetadata {
  executionId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  steps: WorkflowStepResult[];
  performance: PerformanceMetrics;
  auditTrail: AuditEntry[];
  tenantContext: TenantContext;
}

export interface WorkflowStepResult {
  stepId: string;
  stepName: string;
  success: boolean;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  data?: any;
  errors?: WorkflowError[];
  retryCount: number;
}

export interface PerformanceMetrics {
  memoryUsage: number;
  cpuUsage: number;
  databaseQueries: number;
  apiCalls: number;
  cacheHits: number;
  cacheMisses: number;
  responseTime: number;
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

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  features: string[];
  limits: TenantLimits;
  security: TenantSecurity;
}

export interface TenantLimits {
  maxUsers: number;
  maxStorage: number;
  maxApiCalls: number;
  maxConcurrentSessions: number;
  dataRetentionDays: number;
}

export interface TenantSecurity {
  encryptionEnabled: boolean;
  ssoEnabled: boolean;
  mfaRequired: boolean;
  sessionTimeout: number;
}

/**
 * Create a successful workflow result
 */
export function createSuccessResult<T>(
  data: T,
  message: string = 'Operation completed successfully',
  metadata?: Partial<WorkflowMetadata>
): WorkflowResult<T> {
  return {
    success: true,
    message,
    data,
    statusCode: 200,
    metadata: {
      executionId: generateExecutionId(),
      startTime: new Date(),
      steps: [],
      performance: {
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: 0,
        databaseQueries: 0,
        apiCalls: 0,
        cacheHits: 0,
        cacheMisses: 0,
        responseTime: 0
      },
      auditTrail: [],
      tenantContext: {
        tenantId: '',
        tenantSlug: '',
        tenantName: '',
        features: [],
        limits: {
          maxUsers: 0,
          maxStorage: 0,
          maxApiCalls: 0,
          maxConcurrentSessions: 0,
          dataRetentionDays: 0
        },
        security: {
          encryptionEnabled: false,
          ssoEnabled: false,
          mfaRequired: false,
          sessionTimeout: 0
        }
      },
      ...metadata
    }
  };
}

/**
 * Create an error workflow result
 */
export function createErrorResult(
  message: string,
  errors: WorkflowError[],
  statusCode: number = 500,
  metadata?: Partial<WorkflowMetadata>
): WorkflowResult {
  return {
    success: false,
    message,
    errors,
    statusCode,
    metadata: {
      executionId: generateExecutionId(),
      startTime: new Date(),
      steps: [],
      performance: {
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: 0,
        databaseQueries: 0,
        apiCalls: 0,
        cacheHits: 0,
        cacheMisses: 0,
        responseTime: 0
      },
      auditTrail: [],
      tenantContext: {
        tenantId: '',
        tenantSlug: '',
        tenantName: '',
        features: [],
        limits: {
          maxUsers: 0,
          maxStorage: 0,
          maxApiCalls: 0,
          maxConcurrentSessions: 0,
          dataRetentionDays: 0
        },
        security: {
          encryptionEnabled: false,
          ssoEnabled: false,
          mfaRequired: false,
          sessionTimeout: 0
        }
      },
      ...metadata
    }
  };
}

/**
 * Create a workflow error
 */
export function createWorkflowError(
  code: string,
  message: string,
  details?: Record<string, any>,
  stepId?: string,
  retryable: boolean = true
): WorkflowError {
  return {
    code,
    message,
    details,
    stepId,
    retryable,
    timestamp: new Date()
  };
}

/**
 * Generate unique execution ID
 */
function generateExecutionId(): string {
  return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Update workflow result with step information
 */
export function addStepResult<T>(
  result: WorkflowResult<T>,
  stepResult: WorkflowStepResult
): WorkflowResult<T> {
  if (!result.metadata) {
    result.metadata = {
      executionId: generateExecutionId(),
      startTime: new Date(),
      steps: [],
      performance: {
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: 0,
        databaseQueries: 0,
        apiCalls: 0,
        cacheHits: 0,
        cacheMisses: 0,
        responseTime: 0
      },
      auditTrail: [],
      tenantContext: {
        tenantId: '',
        tenantSlug: '',
        tenantName: '',
        features: [],
        limits: {
          maxUsers: 0,
          maxStorage: 0,
          maxApiCalls: 0,
          maxConcurrentSessions: 0,
          dataRetentionDays: 0
        },
        security: {
          encryptionEnabled: false,
          ssoEnabled: false,
          mfaRequired: false,
          sessionTimeout: 0
        }
      }
    };
  }

  result.metadata.steps.push(stepResult);
  
  // Update execution time
  if (stepResult.endTime) {
    result.executionTime = stepResult.endTime.getTime() - result.metadata.startTime.getTime();
  }

  return result;
}

/**
 * Add audit entry to workflow result
 */
export function addAuditEntry<T>(
  result: WorkflowResult<T>,
  action: string,
  resource: string,
  details: Record<string, any> = {}
): WorkflowResult<T> {
  if (!result.metadata) {
    result.metadata = {
      executionId: generateExecutionId(),
      startTime: new Date(),
      steps: [],
      performance: {
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: 0,
        databaseQueries: 0,
        apiCalls: 0,
        cacheHits: 0,
        cacheMisses: 0,
        responseTime: 0
      },
      auditTrail: [],
      tenantContext: {
        tenantId: '',
        tenantSlug: '',
        tenantName: '',
        features: [],
        limits: {
          maxUsers: 0,
          maxStorage: 0,
          maxApiCalls: 0,
          maxConcurrentSessions: 0,
          dataRetentionDays: 0
        },
        security: {
          encryptionEnabled: false,
          ssoEnabled: false,
          mfaRequired: false,
          sessionTimeout: 0
        }
      }
    };
  }

  const auditEntry: AuditEntry = {
    timestamp: new Date(),
    action,
    userId: result.metadata.tenantContext.tenantId,
    tenantId: result.metadata.tenantContext.tenantId,
    resource,
    details
  };

  result.metadata.auditTrail.push(auditEntry);
  return result;
}

/**
 * Check if workflow result has errors
 */
export function hasErrors<T>(result: WorkflowResult<T>): boolean {
  return !result.success || (result.errors && result.errors.length > 0);
}

/**
 * Get all errors from workflow result
 */
export function getAllErrors<T>(result: WorkflowResult<T>): WorkflowError[] {
  const errors: WorkflowError[] = [];
  
  if (result.errors) {
    errors.push(...result.errors);
  }
  
  if (result.metadata?.steps) {
    result.metadata.steps.forEach(step => {
      if (step.errors) {
        errors.push(...step.errors);
      }
    });
  }
  
  return errors;
}

/**
 * Get retryable errors from workflow result
 */
export function getRetryableErrors<T>(result: WorkflowResult<T>): WorkflowError[] {
  return getAllErrors(result).filter(error => error.retryable);
}

/**
 * Merge multiple workflow results
 */
export function mergeWorkflowResults<T>(
  results: WorkflowResult<T>[]
): WorkflowResult<T[]> {
  const success = results.every(result => result.success);
  const allErrors = results.flatMap(result => result.errors || []);
  const allData = results.map(result => result.data).filter(data => data !== undefined);
  
  return {
    success,
    message: success ? 'All operations completed successfully' : 'Some operations failed',
    data: allData,
    errors: allErrors.length > 0 ? allErrors : undefined,
    statusCode: success ? 200 : 500,
    metadata: {
      executionId: generateExecutionId(),
      startTime: new Date(),
      steps: results.flatMap(result => result.metadata?.steps || []),
      performance: {
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: 0,
        databaseQueries: 0,
        apiCalls: 0,
        cacheHits: 0,
        cacheMisses: 0,
        responseTime: 0
      },
      auditTrail: results.flatMap(result => result.metadata?.auditTrail || []),
      tenantContext: {
        tenantId: '',
        tenantSlug: '',
        tenantName: '',
        features: [],
        limits: {
          maxUsers: 0,
          maxStorage: 0,
          maxApiCalls: 0,
          maxConcurrentSessions: 0,
          dataRetentionDays: 0
        },
        security: {
          encryptionEnabled: false,
          ssoEnabled: false,
          mfaRequired: false,
          sessionTimeout: 0
        }
      }
    }
  };
}
