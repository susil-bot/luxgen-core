/**
 * @fileoverview Tenant Class
 * Tenant class following the Hapi.js architecture pattern
 * 
 * @module
 */

import { TenantConfig } from '../types/tenant/TenantDatabaseTypes';

/**
 * App configuration interface
 */
export interface AppConfig {
  tenant: TenantConfig;
  channel: any;
}

/**
 * App configurations by channel interface
 */
export interface AppConfigsByChannel {
  default: AppConfig;
  [channelName: string]: AppConfig;
}

/**
 * Tenant configuration file interface
 */
export interface TenantConfigFile {
  tenantConfig: TenantConfig;
  channelsConfig: any;
}

/**
 * The concept of a tenant, largely houses configuration for a tenant and all
 * its channels.
 */
export default class Tenant {
  public appConfigsByChannel: AppConfigsByChannel;
  public slug: string;

  /**
   * Create a tenant
   *
   * @param slug - brand slug from tenant identification
   * @param tenantConfigFile - the tenant config file which contains tenant and channel config
   */
  constructor(slug: string, tenantConfigFile: TenantConfigFile) {
    const { channelsConfig, tenantConfig } = tenantConfigFile;

    this.slug = slug;
    this.appConfigsByChannel = this.buildAppConfigs(
      channelsConfig,
      tenantConfig
    );
  }

  private buildAppConfigs(
    channelsConfig: any,
    tenantConfig: TenantConfig
  ): AppConfigsByChannel {
    const configs = Object.entries(channelsConfig).reduce(
      (acc, [channelSlug, channelConfig]) => {
        acc[channelSlug] = {
          channel: channelConfig,
          tenant: tenantConfig
        };

        return acc;
      },
      {} as AppConfigsByChannel
    );

    return configs;
  }

  /**
   * Get the list of channels based on the app configs present
   *
   * @returns {Array} an array of strings containing the channel names
   */
  public getChannelList(): string[] {
    return Object.keys(this.appConfigsByChannel);
  }

  /**
   * Get the app config for a channel, falling back to default if no config
   * is defined
   *
   * @param  {string} channel - the channel slug
   * @return {AppConfig} - the app config for the channel, or the default if none present.
   */
  public getConfigForChannel(channel: string): AppConfig {
    return (
      this.appConfigsByChannel[channel] || this.appConfigsByChannel.default
    );
  }
}
