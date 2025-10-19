import { TenantConfig } from '../../core/config/types';

const { LOCAL_USERPLATFORM_URL } = process.env;

export const tenantConfig: TenantConfig = {

  brandSlug: 'demo',
  humanName: 'demo',
  rootBrand: 'demo',
  copilotCode: 'demo',
  siteDomain: {
    production: 'www.demo.luxgen.com',
    staging: 'stag.ad-magazin.de'
  },
  organizationGlobalId: {
    production: '4gKgcF7DPc9LnReoSYZonec54fqS'
  },
  organizationSlug: {
    production: 'demo',
  },
  database: {
    name: 'demo',
    url: 'mongodb://localhost:27017/demo'
  }
}