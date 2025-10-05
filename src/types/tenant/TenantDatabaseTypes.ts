/**
 * @fileoverview Tenant Database Types
 * Comprehensive TypeScript interfaces for tenant-specific database management
 * 
 * @module
 */

import { Connection, Model, Document } from 'mongoose';

/**
 * Tenant database connection state
 */
export enum ConnectionState {
  DISCONNECTED = 0,
  CONNECTED = 1,
  CONNECTING = 2,
  DISCONNECTING = 3
}

/**
 * Tenant database configuration
 */
export interface TenantDatabaseConfig {
  tenantId: string;
  databaseName: string;
  uri: string;
  connectionOptions: {
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
 * Tenant database statistics
 */
export interface TenantDatabaseStats {
  tenantId: string;
  databaseName: string;
  collections: number;
  dataSize: number;
  storageSize: number;
  indexes: number;
  objects: number;
  connectionState: ConnectionState;
  lastAccessed?: Date;
  createdAt?: Date;
}

/**
 * Tenant database health status
 */
export interface TenantDatabaseHealth {
  healthy: boolean;
  tenantId: string;
  databaseName: string;
  connectionState: ConnectionState;
  error?: string;
  lastChecked: Date;
  responseTime?: number;
}

/**
 * Tenant database models interface
 */
export interface TenantDatabaseModels {
  User: Model<any>;
  Poll: Model<any>;
  Activity: Model<any>;
  Job: Model<any>;
  [key: string]: Model<any>;
}

/**
 * Tenant database context
 */
export interface TenantDatabaseContext {
  tenantId: string;
  tenantSlug: string;
  databaseName: string;
  connection: Connection;
  models: TenantDatabaseModels;
  config: TenantDatabaseConfig;
  health: TenantDatabaseHealth;
}

/**
 * Tenant database operation result
 */
export interface TenantDatabaseOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  tenantId: string;
  operation: string;
  timestamp: Date;
}

/**
 * Tenant database initialization options
 */
export interface TenantDatabaseInitOptions {
  createIndexes?: boolean;
  seedData?: boolean;
  validateConnection?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Tenant database cleanup options
 */
export interface TenantDatabaseCleanupOptions {
  closeConnections?: boolean;
  dropDatabase?: boolean;
  removeFromCache?: boolean;
  force?: boolean;
}

/**
 * Tenant database error types
 */
export enum TenantDatabaseErrorType {
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  DATABASE_NOT_FOUND = 'DATABASE_NOT_FOUND',
  TENANT_NOT_FOUND = 'TENANT_NOT_FOUND',
  OPERATION_FAILED = 'OPERATION_FAILED',
  HEALTH_CHECK_FAILED = 'HEALTH_CHECK_FAILED',
  LIMIT_EXCEEDED = 'LIMIT_EXCEEDED'
}

/**
 * Tenant database error interface
 */
export interface TenantDatabaseError extends Error {
  type: TenantDatabaseErrorType;
  tenantId: string;
  operation: string;
  timestamp: Date;
  retryable: boolean;
}

/**
 * Tenant database middleware options
 */
export interface TenantDatabaseMiddlewareOptions {
  autoInitialize?: boolean;
  healthCheckInterval?: number;
  retryAttempts?: number;
  fallbackToDefault?: boolean;
  logOperations?: boolean;
}

/**
 * Tenant database event types
 */
export enum TenantDatabaseEventType {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
  HEALTH_CHECK = 'HEALTH_CHECK',
  OPERATION_START = 'OPERATION_START',
  OPERATION_COMPLETE = 'OPERATION_COMPLETE',
  LIMIT_EXCEEDED = 'LIMIT_EXCEEDED'
}

/**
 * Tenant database event interface
 */
export interface TenantDatabaseEvent {
  type: TenantDatabaseEventType;
  tenantId: string;
  timestamp: Date;
  data?: any;
  error?: Error;
}

/**
 * Tenant database event handler
 */
export type TenantDatabaseEventHandler = (event: TenantDatabaseEvent) => void | Promise<void>;

/**
 * Tenant database configuration resolver
 */
export type TenantDatabaseConfigResolver = (tenantId: string) => Promise<TenantDatabaseConfig>;

/**
 * Tenant database health checker
 */
export type TenantDatabaseHealthChecker = (tenantId: string) => Promise<TenantDatabaseHealth>;

/**
 * Tenant database operation handler
 */
export type TenantDatabaseOperationHandler<T = any> = (
  context: TenantDatabaseContext,
  operation: string,
  data?: any
) => Promise<TenantDatabaseOperationResult<T>>;
