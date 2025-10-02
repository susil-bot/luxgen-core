# Demo Tenant Configuration This directory contains all configuration files for the **Demo Company** tenant. ## Directory Structure ```
demo-tenant/
├── config.js # Main tenant configuration
├── branding/ # Branding assets
│ ├── logo.png # Company logo
│ ├── favicon.ico # Favicon
│ └── custom.css # Custom CSS styles
├── assets/ # Additional assets
│ ├── images/ # Images and graphics
│ └── documents/ # Documents and templates
└── README.md # This file
``` ## Tenant Information - **Name**: Demo Company
- **Slug**: demo-tenant
- **Status**: Active
- **Industry**: Technology
- **Company Size**: 11-50 employees ## Configuration Details ### Features Enabled
- Polls (max 50)
- Analytics (30-day retention)
- Branding customization
- API Access (1000 req/hour)
- File Upload (10MB max)
- Notifications (email, in-app) ### Features Disabled
- Custom Fields
- Multi-language
- SSO
- SMS Notifications ### Limits
- **Max Users**: 25
- **Max Polls per User**: 25
- **Max Responses per Poll**: 500
- **Max File Size**: 10MB
- **Max Storage per User**: 1GB ## 🎨 Branding ### Colors
- **Primary**: #007bff (Blue)
- **Secondary**: #6c757d (Gray)
- **Accent**: #28a745 (Green) ### Custom CSS
The `branding/custom.css` file contains custom styles that will be applied to the tenant's interface. ## 🔗 Access URLs ### Subdomain Access
```
https://demo-tenant.luxgen.com
``` ### Path-based Access
```
https://luxgen.com/tenant/demo-tenant
``` ### API Access
```
https://luxgen.com/api/v1/config/config/demo-tenant
``` ## Deployment To deploy this tenant: 1. **Add to tenant registry**: ```javascript // In src/config/tenants.js const demoTenant = require('./tenants/demo-tenant/config'); ``` 2. **Restart the application**: ```bash pm2 restart luxgen-backend ``` 3. **Verify deployment**: ```bash curl https://demo-tenant.luxgen.com/health ``` ## Customization ### Adding New Features
Edit `config.js` to enable/disable features or modify limits. ### Updating Branding
1. Replace `branding/logo.png` with new logo
2. Update colors in `config.js`
3. Modify `branding/custom.css` for custom styles ### Environment Variables
Set these environment variables for this tenant:
```bash
DEMO_SMTP_HOST=smtp.gmail.com
DEMO_SMTP_PORT=587
DEMO_STRIPE_PUBLISHABLE_KEY=pk_test_...
DEMO_STRIPE_SECRET_KEY=sk_test_...
``` ## Security Notes - This is a demo tenant with relaxed security settings
- Email verification is disabled for easy testing
- Guest access is enabled
- MFA is disabled ## 📞 Support For questions about this tenant configuration:
- Email: help@democompany.com
- Phone: +1-555-0123 