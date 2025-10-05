/**
 * @fileoverview Subdomain Mapping Configuration
 * Subdomain-based tenant identification and routing
 * 
 * @module
 */

export interface SubdomainConfig {
  subdomain: string;
  tenantId: string;
  tenantSlug: string;
  domain: string;
  isProduction: boolean;
  features: string[];
  limits: {
    maxUsers: number;
    maxPolls: number;
    maxActivities: number;
    maxJobs: number;
  };
  branding: {
    name: string;
    logo: string;
    primaryColor: string;
    secondaryColor: string;
  };
}

/**
 * SUBDOMAIN MAPPING CONFIGURATION
 * Maps subdomains to tenant configurations
 */
export const SUBDOMAIN_MAPPING: Record<string, SubdomainConfig> = {
  // LuxGen Production Tenant
  'luxgen': {
    subdomain: 'luxgen',
    tenantId: 'luxgen',
    tenantSlug: 'luxgen',
    domain: 'luxgen.com',
    isProduction: true,
    features: ['users', 'polls', 'activities', 'jobs', 'analytics', 'reporting'],
    limits: {
      maxUsers: 10000,
      maxPolls: 1000,
      maxActivities: 50000,
      maxJobs: 500
    },
    branding: {
      name: 'LuxGen',
      logo: '/assets/logos/luxgen-logo.png',
      primaryColor: '#1a365d',
      secondaryColor: '#2d3748'
    }
  },

  // Demo Tenant
  'demo': {
    subdomain: 'demo',
    tenantId: 'demo',
    tenantSlug: 'demo',
    domain: 'demo.luxgen.com',
    isProduction: false,
    features: ['users', 'polls', 'activities', 'jobs'],
    limits: {
      maxUsers: 100,
      maxPolls: 50,
      maxActivities: 1000,
      maxJobs: 25
    },
    branding: {
      name: 'LuxGen Demo',
      logo: '/assets/logos/luxgen-demo-logo.png',
      primaryColor: '#2b6cb0',
      secondaryColor: '#4299e1'
    }
  },

  // Test Tenant
  'test': {
    subdomain: 'test',
    tenantId: 'test',
    tenantSlug: 'test',
    domain: 'test.luxgen.com',
    isProduction: false,
    features: ['users', 'polls', 'activities', 'jobs'],
    limits: {
      maxUsers: 50,
      maxPolls: 25,
      maxActivities: 500,
      maxJobs: 10
    },
    branding: {
      name: 'LuxGen Test',
      logo: '/assets/logos/luxgen-test-logo.png',
      primaryColor: '#38a169',
      secondaryColor: '#68d391'
    }
  },

  // Development Tenant
  'dev': {
    subdomain: 'dev',
    tenantId: 'dev',
    tenantSlug: 'dev',
    domain: 'dev.luxgen.com',
    isProduction: false,
    features: ['users', 'polls', 'activities', 'jobs', 'debug'],
    limits: {
      maxUsers: 10,
      maxPolls: 5,
      maxActivities: 100,
      maxJobs: 3
    },
    branding: {
      name: 'LuxGen Dev',
      logo: '/assets/logos/luxgen-dev-logo.png',
      primaryColor: '#d69e2e',
      secondaryColor: '#f6e05e'
    }
  }
};

/**
 * Get tenant configuration by subdomain
 * 
 * @param subdomain - The subdomain to look up
 * @returns SubdomainConfig or null if not found
 */
export function getTenantBySubdomain(subdomain: string): SubdomainConfig | null {
  return SUBDOMAIN_MAPPING[subdomain] || null;
}

/**
 * Get all available subdomains
 * 
 * @returns Array of subdomain strings
 */
export function getAllSubdomains(): string[] {
  return Object.keys(SUBDOMAIN_MAPPING);
}

/**
 * Get all tenant configurations
 * 
 * @returns Array of SubdomainConfig objects
 */
export function getAllTenantConfigs(): SubdomainConfig[] {
  return Object.values(SUBDOMAIN_MAPPING);
}

/**
 * Check if subdomain is valid
 * 
 * @param subdomain - The subdomain to validate
 * @returns boolean indicating if subdomain is valid
 */
export function isValidSubdomain(subdomain: string): boolean {
  return subdomain in SUBDOMAIN_MAPPING;
}

/**
 * Get tenant configuration by tenant ID
 * 
 * @param tenantId - The tenant ID to look up
 * @returns SubdomainConfig or null if not found
 */
export function getTenantById(tenantId: string): SubdomainConfig | null {
  return Object.values(SUBDOMAIN_MAPPING).find(config => config.tenantId === tenantId) || null;
}

/**
 * Get production tenants only
 * 
 * @returns Array of production SubdomainConfig objects
 */
export function getProductionTenants(): SubdomainConfig[] {
  return Object.values(SUBDOMAIN_MAPPING).filter(config => config.isProduction);
}

/**
 * Get development tenants only
 * 
 * @returns Array of development SubdomainConfig objects
 */
export function getDevelopmentTenants(): SubdomainConfig[] {
  return Object.values(SUBDOMAIN_MAPPING).filter(config => !config.isProduction);
}

/**
 * Extract subdomain from hostname
 * 
 * @param hostname - The full hostname
 * @returns The subdomain or null if not found
 */
export function extractSubdomain(hostname: string): string | null {
  const parts = hostname.split('.');
  
  // Handle localhost development
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    // For localhost, check for port-based routing or default to luxgen
    return 'luxgen';
  }
  
  // Handle production domains
  if (parts.length >= 3) {
    const subdomain = parts[0];
    return isValidSubdomain(subdomain) ? subdomain : null;
  }
  
  // Handle direct domain access (no subdomain)
  if (parts.length === 2) {
    // Check if this is the main domain
    const domain = parts.join('.');
    const mainDomainConfig = Object.values(SUBDOMAIN_MAPPING).find(config => config.domain === domain);
    return mainDomainConfig ? mainDomainConfig.subdomain : null;
  }
  
  return null;
}

/**
 * Get full domain for a subdomain
 * 
 * @param subdomain - The subdomain
 * @returns The full domain or null if not found
 */
export function getFullDomain(subdomain: string): string | null {
  const config = getTenantBySubdomain(subdomain);
  return config ? config.domain : null;
}

/**
 * Check if tenant has specific feature
 * 
 * @param subdomain - The subdomain
 * @param feature - The feature to check
 * @returns boolean indicating if feature is available
 */
export function hasFeature(subdomain: string, feature: string): boolean {
  const config = getTenantBySubdomain(subdomain);
  return config ? config.features.includes(feature) : false;
}

/**
 * Get tenant limits
 * 
 * @param subdomain - The subdomain
 * @returns Tenant limits or null if not found
 */
export function getTenantLimits(subdomain: string) {
  const config = getTenantBySubdomain(subdomain);
  return config ? config.limits : null;
}

/**
 * Get tenant branding
 * 
 * @param subdomain - The subdomain
 * @returns Tenant branding or null if not found
 */
export function getTenantBranding(subdomain: string) {
  const config = getTenantBySubdomain(subdomain);
  return config ? config.branding : null;
}

export default SUBDOMAIN_MAPPING;
