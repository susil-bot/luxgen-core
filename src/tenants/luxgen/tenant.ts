import { TenantConfig } from '../../core/config/types';

const { LOCAL_USERPLATFORM_URL } = process.env;

export const tenantConfig: TenantConfig = {

  brandSlug: 'luxgen',
  humanName: 'luxgen',
  rootBrand: 'luxgen',
  copilotCode: 'luxgen',
  siteDomain: {
    production: 'www.luxgen.com',// TODO: Add staging domain of free deployment platform 
  },
  organizationGlobalId: {
    production: '4gKgcF7DPc9LnReoSYZonec54fqS'
  },
  organizationSlug: {
    production: 'luxgen',
  },
  database: {
    name: 'luxgen',
    url: 'mongodb://localhost:27017/luxgen'
  }
}